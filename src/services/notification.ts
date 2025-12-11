import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './api';
import { Notification, PaginatedResponse } from '@/types';
import { API_CONFIG } from '@/constants/config';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private isConfigured = false;

  async configure(): Promise<void> {
    if (this.isConfigured) return;

    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const token = await this.getPushToken();
      if (token) {
        await this.registerPushToken(token);
      }

      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to configure notifications:', error);
    }
  }

  async getPushToken(): Promise<string | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });
      return tokenData.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  private async registerPushToken(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register-token', { token });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  async getNotifications(page = 1, limit = 20): Promise<PaginatedResponse<Notification>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      return await apiClient.get<PaginatedResponse<Notification>>(
        `${API_CONFIG.endpoints.notifications.list}?${params.toString()}`
      );
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(
        API_CONFIG.endpoints.notifications.markRead.replace('{id}', notificationId)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch(API_CONFIG.endpoints.notifications.markAllRead);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications(1, 100);
      return notifications.data.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Local notification methods
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    delay = 0
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: delay > 0 ? { seconds: delay } : null,
      });
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      return null;
    }
  }

  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel scheduled notification:', error);
    }
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all scheduled notifications:', error);
    }
  }

  // Notification listeners
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationReceivedInAppListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Mock data for development
  getMockNotifications(): Notification[] {
    return [
      {
        id: '1',
        userId: 'user1',
        title: 'Visitor Arrived',
        message: 'John Doe has arrived at the gate and is waiting for approval',
        type: 'visitor',
        priority: 'medium',
        read: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        actionUrl: '/visitor/1',
      },
      {
        id: '2',
        userId: 'user1',
        title: 'Security Alert',
        message: 'Unusual activity detected near building entrance',
        type: 'security',
        priority: 'high',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actionUrl: '/security/incidents',
      },
      {
        id: '3',
        userId: 'user1',
        title: 'Maintenance Scheduled',
        message: 'Water maintenance scheduled for tomorrow 9AM-12PM',
        type: 'maintenance',
        priority: 'low',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      },
      {
        id: '4',
        userId: 'user1',
        title: 'New Security Tips',
        message: 'Check out the latest security awareness tips',
        type: 'system',
        priority: 'info',
        read: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];
  }
}

export const notificationService = new NotificationService();