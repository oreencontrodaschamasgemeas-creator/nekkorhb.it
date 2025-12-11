import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { visitorService } from '@/services/visitor';
import { CreateVisitorRequest, Visitor } from '@/services/visitor';

export function VisitorManagementScreen() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVisitor, setNewVisitor] = useState<Partial<CreateVisitorRequest>>({
    name: '',
    phone: '',
    idNumber: '',
    purpose: '',
    expectedArrival: new Date(),
    notes: '',
  });

  useEffect(() => {
    loadVisitors();
  }, []);

  useEffect(() => {
    filterVisitors();
  }, [visitors, searchQuery, filterStatus]);

  const loadVisitors = async () => {
    try {
      // In development, use mock data
      const mockVisitors = visitorService.getMockVisitors();
      setVisitors(mockVisitors);
    } catch (error) {
      Alert.alert('Error', 'Failed to load visitors');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVisitors();
    } finally {
      setRefreshing(false);
    }
  };

  const filterVisitors = () => {
    let filtered = visitors;

    if (searchQuery) {
      filtered = filtered.filter(visitor =>
        visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.purpose.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(visitor => visitor.status === filterStatus);
    }

    setFilteredVisitors(filtered);
  };

  const handleCreateVisitor = async () => {
    if (!newVisitor.name || !newVisitor.phone || !newVisitor.idNumber || !newVisitor.purpose) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const visitorData: CreateVisitorRequest = {
        name: newVisitor.name!,
        phone: newVisitor.phone!,
        idNumber: newVisitor.idNumber!,
        purpose: newVisitor.purpose!,
        expectedArrival: newVisitor.expectedArrival!,
        notes: newVisitor.notes,
      };

      // In development, just simulate creation
      const createdVisitor: Visitor = {
        id: Date.now().toString(),
        ...visitorData,
        status: 'pending',
        hostId: 'current-user',
        hostName: 'Current User',
        qrCode: 'mock-qr-code-' + Date.now(),
      };

      setVisitors(prev => [createdVisitor, ...prev]);
      setShowCreateModal(false);
      setNewVisitor({
        name: '',
        phone: '',
        idNumber: '',
        purpose: '',
        expectedArrival: new Date(),
        notes: '',
      });

      Alert.alert('Success', 'Visitor added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create visitor');
    }
  };

  const handleApproveVisitor = async (id: string) => {
    try {
      setVisitors(prev =>
        prev.map(visitor =>
          visitor.id === id ? { ...visitor, status: 'approved' as const } : visitor
        )
      );
      Alert.alert('Success', 'Visitor approved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve visitor');
    }
  };

  const handleDenyVisitor = async (id: string) => {
    try {
      setVisitors(prev =>
        prev.map(visitor =>
          visitor.id === id ? { ...visitor, status: 'denied' as const } : visitor
        )
      );
      Alert.alert('Success', 'Visitor denied');
    } catch (error) {
      Alert.alert('Error', 'Failed to deny visitor');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return Colors.light.success;
      case 'pending': return Colors.light.warning;
      case 'denied': return Colors.light.error;
      case 'checked-in': return Colors.light.visitor;
      case 'checked-out': return Colors.light.textSecondary;
      default: return Colors.light.textSecondary;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderVisitorItem = ({ item: visitor }: { item: Visitor }) => (
    <View style={styles.visitorCard}>
      <View style={styles.visitorHeader}>
        <Text style={styles.visitorName}>{visitor.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visitor.status) }]}>
          <Text style={styles.statusText}>{formatStatus(visitor.status)}</Text>
        </View>
      </View>

      <Text style={styles.visitorDetail}>Purpose: {visitor.purpose}</Text>
      <Text style={styles.visitorDetail}>Phone: {visitor.phone}</Text>
      <Text style={styles.visitorDetail}>
        Expected: {new Date(visitor.expectedArrival).toLocaleString()}
      </Text>
      {visitor.notes && (
        <Text style={styles.visitorNotes}>Notes: {visitor.notes}</Text>
      )}

      {visitor.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveVisitor(visitor.id)}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyVisitor(visitor.id)}
          >
            <Text style={[styles.actionButtonText, { color: Colors.light.error }]}>Deny</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Visitor Management</Text>
        <Text style={styles.headerSubtitle}>Manage your visitors and approvals</Text>
      </LinearGradient>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search visitors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {['all', 'pending', 'approved', 'denied', 'checked-in'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status && styles.filterButtonTextActive,
              ]}
            >
              {status === 'all' ? 'All' : formatStatus(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Visitor Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Visitor</Text>
      </TouchableOpacity>

      {/* Visitors List */}
      <FlatList
        data={filteredVisitors}
        renderItem={renderVisitorItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Visitor Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Visitor</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Visitor Name"
              value={newVisitor.name}
              onChangeText={(value) => setNewVisitor(prev => ({ ...prev, name: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={newVisitor.phone}
              onChangeText={(value) => setNewVisitor(prev => ({ ...prev, phone: value }))}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="ID Number"
              value={newVisitor.idNumber}
              onChangeText={(value) => setNewVisitor(prev => ({ ...prev, idNumber: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Purpose of Visit"
              value={newVisitor.purpose}
              onChangeText={(value) => setNewVisitor(prev => ({ ...prev, purpose: value }))}
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Additional Notes (Optional)"
              value={newVisitor.notes}
              onChangeText={(value) => setNewVisitor(prev => ({ ...prev, notes: value }))}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateVisitor}
            >
              <Text style={styles.submitButtonText}>Create Visitor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  visitorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
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
  },
  visitorDetail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  visitorNotes: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: Colors.light.success,
  },
  denyButton: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.light.textSecondary,
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});