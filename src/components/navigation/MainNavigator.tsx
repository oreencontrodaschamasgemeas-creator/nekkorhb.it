import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { VisitorManagementScreen } from '@/components/screens/VisitorManagementScreen';
import { NotificationsScreen } from '@/components/screens/NotificationsScreen';
import { SecurityTipsScreen } from '@/components/screens/SecurityTipsScreen';
import { AccessLogsScreen } from '@/components/screens/AccessLogsScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function VisitorStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VisitorManagement"
        component={VisitorManagementScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function SecurityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Security"
        component={SecurityTipsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function LogsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AccessLogs"
        component={AccessLogsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export function MainNavigator() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].textSecondary,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].surface,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Visitors"
        component={VisitorStack}
        options={{
          title: 'Visitors',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🔔</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Security"
        component={SecurityStack}
        options={{
          title: 'Security',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🛡️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Logs"
        component={LogsStack}
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}