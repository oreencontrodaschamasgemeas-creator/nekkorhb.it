import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/store/auth';
import { Colors } from '@/constants/theme';
import { visitorService } from '@/services/visitor';
import { notificationService } from '@/services/notification';
import { Visitor, Notification } from '@/types';

export function DashboardScreen() {
  const { user, refreshUser } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayVisitors: 0,
    pendingApprovals: 0,
    unreadNotifications: 0,
    recentAccess: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // In development, use mock data
      const mockVisitors = visitorService.getMockVisitors();
      const mockNotifications = notificationService.getMockNotifications();
      
      setVisitors(mockVisitors.slice(0, 3)); // Show only first 3
      setNotifications(mockNotifications.slice(0, 3)); // Show only first 3

      // Calculate stats
      setStats({
        todayVisitors: mockVisitors.filter(v => {
          const today = new Date();
          const visitDate = new Date(v.expectedArrival);
          return visitDate.toDateString() === today.toDateString();
        }).length,
        pendingApprovals: mockVisitors.filter(v => v.status === 'pending').length,
        unreadNotifications: mockNotifications.filter(n => !n.read).length,
        recentAccess: 5, // Mock data
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDashboardData(), refreshUser()]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return Colors.light.success;
      case 'pending': return Colors.light.warning;
      case 'denied': return Colors.light.error;
      case 'checked-in': return Colors.light.visitor;
      default: return Colors.light.textSecondary;
    }
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.secondary]}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.name || 'Resident'}</Text>
        <Text style={styles.unitText}>Unit {user?.unit || ''}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors.light.visitor }]}>
            <Text style={styles.statNumber}>{stats.todayVisitors}</Text>
            <Text style={styles.statLabel}>Today's Visitors</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.light.warning }]}>
            <Text style={styles.statNumber}>{stats.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.light.notification }]}>
            <Text style={styles.statNumber}>{stats.unreadNotifications}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.light.access }]}>
            <Text style={styles.statNumber}>{stats.recentAccess}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Add Visitor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>View Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💡</Text>
              <Text style={styles.actionLabel}>Security Tips</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔔</Text>
              <Text style={styles.actionLabel}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Visitors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Visitors</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {visitors.map((visitor) => (
            <View key={visitor.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{visitor.name}</Text>
                <Text style={styles.listItemSubtitle}>{visitor.purpose}</Text>
                <Text style={styles.listItemTime}>
                  {new Date(visitor.expectedArrival).toLocaleTimeString()}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) }]}>
                <Text style={styles.statusText}>{visitor.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {notifications.map((notification) => (
            <View key={notification.id} style={[styles.listItem, !notification.read && styles.unreadItem]}>
              <Text style={styles.notificationIcon}>{getNotificationIcon(notification.type)}</Text>
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemTitle, !notification.read && styles.unreadTitle]}>
                  {notification.title}
                </Text>
                <Text style={styles.listItemSubtitle}>{notification.message}</Text>
                <Text style={styles.listItemTime}>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  unitText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.light.text,
    textAlign: 'center',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  listItemTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
});