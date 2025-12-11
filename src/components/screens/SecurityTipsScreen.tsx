import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { SecurityTip } from '@/types';

export function SecurityTipsScreen() {
  const [tips, setTips] = useState<SecurityTip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    loadSecurityTips();
  }, []);

  const loadSecurityTips = async () => {
    try {
      // In development, use mock data
      const mockTips: SecurityTip[] = [
        {
          id: '1',
          title: 'Spotting Suspicious Activity',
          content: 'Be aware of your surroundings and report any unusual behavior to security. Look for people who don\'t belong or seem out of place.',
          category: 'awareness',
          severity: 'warning',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          tags: ['surveillance', 'awareness', 'reporting'],
          readBy: [],
        },
        {
          id: '2',
          title: 'Door Security Best Practices',
          content: 'Always ensure doors close properly behind you. Don\'t hold doors open for strangers, and never prop open secured entrances.',
          category: 'prevention',
          severity: 'info',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          tags: ['access-control', 'doors', 'prevention'],
          readBy: [],
        },
        {
          id: '3',
          title: 'Emergency Contact Procedures',
          content: 'Keep emergency contact numbers easily accessible. Know how to contact building security, local police, and fire department.',
          category: 'emergency',
          severity: 'critical',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          tags: ['emergency', 'contacts', 'procedures'],
          readBy: [],
        },
        {
          id: '4',
          title: 'Cybersecurity in Smart Buildings',
          content: 'Be cautious when using building WiFi networks and smart devices. Update passwords regularly and be aware of potential digital threats.',
          category: 'technology',
          severity: 'warning',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          tags: ['cybersecurity', 'smart-devices', 'wifi'],
          readBy: [],
        },
        {
          id: '5',
          title: 'Visitor Verification',
          content: 'Always verify visitor identity before allowing access. Check IDs and confirm appointments. Never let unknown individuals follow you through secure doors.',
          category: 'prevention',
          severity: 'warning',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          tags: ['visitor-management', 'verification', 'access-control'],
          readBy: [],
        },
      ];
      setTips(mockTips);
    } catch (error) {
      Alert.alert('Error', 'Failed to load security tips');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSecurityTips();
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = (tipId: string) => {
    setTips(prev =>
      prev.map(tip =>
        tip.id === tipId && !tip.readBy.includes('current-user')
          ? { ...tip, readBy: [...tip.readBy, 'current-user'] }
          : tip
      )
    );
  };

  const getFilteredTips = () => {
    let filtered = tips;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(tip => tip.category === filterCategory);
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(tip => tip.severity === filterSeverity);
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prevention': return '🛡️';
      case 'awareness': return '👁️';
      case 'emergency': return '🚨';
      case 'technology': return '💻';
      default: return '💡';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return Colors.light.error;
      case 'warning': return Colors.light.warning;
      case 'info': return Colors.light.visitor;
      default: return Colors.light.textSecondary;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatSeverity = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const renderTipItem = ({ item: tip }: { item: SecurityTip }) => {
    const isRead = tip.readBy.includes('current-user');
    
    return (
      <TouchableOpacity
        style={[
          styles.tipCard,
          !isRead && styles.unreadTip,
        ]}
        onPress={() => markAsRead(tip.id)}
      >
        <View style={styles.tipHeader}>
          <Text style={styles.tipIcon}>{getCategoryIcon(tip.category)}</Text>
          <View style={styles.tipHeaderContent}>
            <Text style={[
              styles.tipTitle,
              !isRead && styles.unreadTitle,
            ]}>
              {tip.title}
            </Text>
            <View style={styles.tipMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{formatCategory(tip.category)}</Text>
              </View>
              <View style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(tip.severity) }
              ]}>
                <Text style={styles.severityText}>{formatSeverity(tip.severity)}</Text>
              </View>
              <Text style={styles.tipTime}>{formatTime(tip.updatedAt)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.tipContent}>{tip.content}</Text>

        {tip.tags && tip.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tip.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredTips = getFilteredTips();
  const unreadCount = tips.filter(tip => !tip.readBy.includes('current-user')).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.security, Colors.light.error]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Security Tips</Text>
        <Text style={styles.headerSubtitle}>Stay informed and stay safe</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
          </View>
        )}
      </LinearGradient>

      {/* Filter Controls */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Category:</Text>
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'prevention', label: 'Prevention' },
            { key: 'awareness', label: 'Awareness' },
            { key: 'emergency', label: 'Emergency' },
            { key: 'technology', label: 'Technology' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterCategory === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilterCategory(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterCategory === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.filterLabel, { marginTop: 12 }]}>Severity:</Text>
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'critical', label: 'Critical' },
            { key: 'warning', label: 'Warning' },
            { key: 'info', label: 'Info' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterSeverity === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilterSeverity(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterSeverity === filter.key && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips List */}
      <FlatList
        data={filteredTips}
        renderItem={renderTipItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛡️</Text>
            <Text style={styles.emptyTitle}>No security tips</Text>
            <Text style={styles.emptySubtitle}>
              No tips match your current filters
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
    position: 'relative',
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
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.security,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.surface,
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
  tipCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.textSecondary,
  },
  unreadTip: {
    borderLeftColor: Colors.light.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  tipHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 4,
  },
  tipHeaderContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  tipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  tipTime: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  tipContent: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tagText: {
    fontSize: 10,
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