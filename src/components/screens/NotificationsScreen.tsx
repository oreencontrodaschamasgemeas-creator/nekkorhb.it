import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { notificationService } from '@/services/notification';
import { Notification } from '@/types';

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // In development, use mock data
      const mockNotifications = notificationService.getMockNotifications();
      setNotifications(mockNotifications);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notifications');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          read: true,
          readAt: notification.readAt || new Date(),
        }))
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.read);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(notification => notification.type === filterType);
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'visitor': return '👤';
      case 'security': return '🔒';
      case 'maintenance': return '🔧';
      case 'system': return '⚙️';
      default: return '📱';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.light.error;
      case 'high': return Colors.light.warning;
      case 'medium': return Colors.light.visitor;
      case 'low': return Colors.light.textSecondary;
      default: return Colors.light.textSecondary;
    }
  };

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderNotificationItem = ({ item: notification }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadNotification,
      ]}
      onPress={() => !notification.read && handleMarkAsRead(notification.id)}
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationIcon}>{getNotificationIcon(notification.type)}</Text>
        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadTitle,
            ]}>
              {notification.title}
            </Text>
            <View style={styles.priorityContainer}>
              <View style={[
                styles.priorityDot,
                { backgroundColor: getPriorityColor(notification.priority) }
              ]} />
              <Text style={styles.priorityText}>{formatPriority(notification.priority)}</Text>
            </View>
          </View>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>{formatTime(notification.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.notification, Colors.light.warning]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>Stay updated with important information</Text>
      </LinearGradient>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Unread only</Text>
          <Switch
            value={showUnreadOnly}
            onValueChange={setShowUnreadOnly}
            trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
            thumbColor={showUnreadOnly ? Colors.light.primary : Colors.light.textSecondary}
          />
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'visitor', label: 'Visitors' },
          { key: 'security', label: 'Security' },
          { key: 'maintenance', label: 'Maintenance' },
          { key: 'system', label: 'System' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filterType === tab.key && styles.filterTabActive,
            ]}
            onPress={() => setFilterType(tab.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterType === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {showUnreadOnly ? 'All notifications have been read' : 'No notifications yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.notification,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.light.text,
    marginRight: 12,
  },
  markAllReadButton: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllReadText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: Colors.light.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  unreadNotification: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});