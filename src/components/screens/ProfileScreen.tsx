import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/store/auth';
import { authService } from '@/services/auth';
import { Colors } from '@/constants/theme';

export function ProfileScreen() {
  const { user, logout, biometricEnabled, enableBiometric, disableBiometric } = useAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricSetting, setBiometricSetting] = useState(biometricEnabled);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await authService.isBiometricAvailable();
    setBiometricAvailable(available);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      Alert.prompt(
        'Setup Biometric Auth',
        'Enter your password to enable biometric authentication:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async (password) => {
              if (password) {
                const success = await authService.setupBiometricAuth(password);
                if (success) {
                  setBiometricSetting(true);
                  Alert.alert('Success', 'Biometric authentication enabled');
                } else {
                  Alert.alert('Error', 'Failed to enable biometric authentication');
                }
              }
            },
          },
        ],
        'secure-text'
      );
    } else {
      setBiometricSetting(false);
      Alert.alert('Success', 'Biometric authentication disabled');
    }
  };

  const menuItems = [
    {
      title: 'Account Settings',
      subtitle: 'Update personal information',
      icon: '👤',
      onPress: () => Alert.alert('Info', 'Account settings coming soon'),
    },
    {
      title: 'Security Settings',
      subtitle: 'Password and authentication',
      icon: '🔐',
      onPress: () => Alert.alert('Info', 'Security settings coming soon'),
    },
    {
      title: 'Notification Settings',
      subtitle: 'Manage your alerts',
      icon: '🔔',
      onPress: () => Alert.alert('Info', 'Notification settings coming soon'),
    },
    {
      title: 'Privacy Settings',
      subtitle: 'Control your data',
      icon: '🛡️',
      onPress: () => Alert.alert('Info', 'Privacy settings coming soon'),
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: '❓',
      onPress: () => Alert.alert('Info', 'Help & Support coming soon'),
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      icon: 'ℹ️',
      onPress: () => Alert.alert('Resident App', 'Version 1.0.0\nBuilt with ❤️ for secure communities'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.secondary]}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.unit}>Unit {user?.unit || ''}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          {biometricAvailable && (
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>👆</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Biometric Authentication</Text>
                <Text style={styles.menuSubtitle}>
                  Use {biometricAvailable === 'FaceID' ? 'Face ID' : 'fingerprint'} to login
                </Text>
              </View>
              <Switch
                value={biometricSetting}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                thumbColor={biometricSetting ? Colors.light.primary : Colors.light.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  unit: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  arrow: {
    fontSize: 18,
    color: Colors.light.textSecondary,
  },
  logoutButton: {
    backgroundColor: Colors.light.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});