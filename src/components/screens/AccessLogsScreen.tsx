import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { AccessLog } from '@/types';

export function AccessLogsScreen() {
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  useEffect(() => {
    loadAccessLogs();
  }, []);

  const loadAccessLogs = async () => {
    try {
      // In development, use mock data
      const mockLogs: AccessLog[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          type: 'entry',
          method: 'qr',
          location: 'Main Entrance',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          success: true,
          deviceInfo: 'iPhone 14 Pro',
        },
        {
          id: '2',
          userId: 'user1',
          userName: 'John Doe',
          type: 'exit',
          method: 'biometric',
          location: 'Main Entrance',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          success: true,
          deviceInfo: 'iPhone 14 Pro',
        },
        {
          id: '3',
          userId: 'user1',
          userName: 'John Doe',
          type: 'entry',
          method: 'pin',
          location: 'Parking Garage',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          success: true,
          deviceInfo: 'Android Device',
        },
        {
          id: '4',
          userId: 'user2',
          userName: 'Jane Smith',
          type: 'entry',
          method: 'facial',
          location: 'Side Entrance',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          success: true,
          deviceInfo: 'iPad Pro',
        },
        {
          id: '5',
          userId: 'user1',
          userName: 'John Doe',
          type: 'exit',
          method: 'qr',
          location: 'Main Entrance',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          success: true,
          deviceInfo: 'iPhone 14 Pro',
        },
        {
          id: '6',
          userId: 'user3',
          userName: 'Bob Wilson',
          type: 'entry',
          method: 'manual',
          location: 'Service Entrance',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          success: true,
          deviceInfo: 'Security Booth',
        },
        {
          id: '7',
          userId: 'user1',
          userName: 'John Doe',
          type: 'entry',
          method: 'biometric',
          location: 'Main Entrance',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          success: false,
          deviceInfo: 'iPhone 14 Pro',
        },
        {
          id: '8',
          userId: 'user1',
          userName: 'John Doe',
          type: 'entry',
          method: 'qr',
          location: 'Main Entrance',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
          success: true,
          deviceInfo: 'iPhone 14 Pro',
        },
      ];
      setAccessLogs(mockLogs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load access logs');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAccessLogs();
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredLogs = () => {
    let filtered = accessLogs;

    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    if (filterMethod !== 'all') {
      filtered = filtered.filter(log => log.method === filterMethod);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'qr': return '📱';
      case 'biometric': return '👆';
      case 'facial': return '📷';
      case 'pin': return '🔢';
      case 'manual': return '🛂';
      default: return '🚪';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'qr': return Colors.light.visitor;
      case 'biometric': return Colors.light.success;
      case 'facial': return Colors.light.notification;
      case 'pin': return Colors.light.warning;
      case 'manual': return Colors.light.textSecondary;
      default: return Colors.light.textSecondary;
    }
  };

  const getLocationIcon = (location: string) => {
    if (location.includes('Main')) return '🚪';
    if (location.includes('Parking')) return '🅿️';
    if (location.includes('Side')) return '🚶';
    if (location.includes('Service')) return '🔧';
    return '🏢';
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

  const formatMethod = (method: string) => {
    switch (method) {
      case 'qr': return 'QR Code';
      case 'biometric': return 'Biometric';
      case 'facial': return 'Facial';
      case 'pin': return 'PIN';
      case 'manual': return 'Manual';
      default: return method;
    }
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = accessLogs.filter(log => 
      new Date(log.timestamp) >= today
    );

    const entries = todayLogs.filter(log => log.type === 'entry').length;
    const exits = todayLogs.filter(log => log.type === 'exit').length;
    const successful = todayLogs.filter(log => log.success).length;
    const failed = todayLogs.filter(log => !log.success).length;

    return { entries, exits, successful, failed, total: todayLogs.length };
  };

  const renderLogItem = ({ item: log }: { item: AccessLog }) => (
    <View style={[
      styles.logCard,
      !log.success && styles.failedLog,
    ]}>
      <View style={styles.logHeader}>
        <View style={styles.logIconContainer}>
          <Text style={styles.logIcon}>{getLocationIcon(log.location)}</Text>
        </View>
        <View style={styles.logContent}>
          <View style={styles.logTitleRow}>
            <Text style={styles.logTitle}>{log.location}</Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: log.type === 'entry' ? Colors.light.access : Colors.light.notification }
            ]}>
              <Text style={styles.typeText}>{formatType(log.type)}</Text>
            </View>
          </View>
          <Text style={styles.logSubtitle}>{log.userName}</Text>
          <Text style={styles.logDetail}>
            {getMethodIcon(log.method)} {formatMethod(log.method)}
          </Text>
          {log.deviceInfo && (
            <Text style={styles.deviceInfo}>{log.deviceInfo}</Text>
          )}
        </View>
        <View style={styles.logRight}>
          <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
          {!log.success && (
            <Text style={styles.failedIcon}>❌</Text>
          )}
        </View>
      </View>
    </View>
  );

  const filteredLogs = getFilteredLogs();
  const stats = getStats();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.access, Colors.light.success]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Access Logs</Text>
        <Text style={styles.headerSubtitle}>Track entry and exit activity</Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.entries}</Text>
          <Text style={styles.statLabel}>Today's Entries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.exits}</Text>
          <Text style={styles.statLabel}>Exits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.successful}</Text>
          <Text style={styles.statLabel}>Successful</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* Filter Controls */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Type:</Text>
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'entry', label: 'Entry' },
            { key: 'exit', label: 'Exit' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterType === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.filterLabel, { marginTop: 12 }]}>Method:</Text>
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'qr', label: 'QR' },
            { key: 'biometric', label: 'Bio' },
            { key: 'pin', label: 'PIN' },
            { key: 'facial', label: 'Face' },
            { key: 'manual', label: 'Manual' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterMethod === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilterMethod(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterMethod === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚪</Text>
            <Text style={styles.emptyTitle}>No access logs</Text>
            <Text style={styles.emptySubtitle}>
              {filterType === 'all' && filterMethod === 'all' 
                ? 'No access activity recorded' 
                : 'No logs match your current filters'
              }
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
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  filterButtonTextActive: {
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
  logCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.access,
  },
  failedLog: {
    borderLeftColor: Colors.light.error,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logIcon: {
    fontSize: 20,
  },
  logContent: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  logSubtitle: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  logDetail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  deviceInfo: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  failedIcon: {
    fontSize: 16,
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