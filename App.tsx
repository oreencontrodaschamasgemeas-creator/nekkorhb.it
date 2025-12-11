import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/store/auth';
import { Colors } from '@/constants/theme';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { RegisterScreen } from '@/components/auth/RegisterScreen';
import { MainNavigator } from '@/components/navigation/MainNavigator';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterScreen onNavigateToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginScreen 
        onNavigateToRegister={() => setShowRegister(true)}
        onNavigateToForgotPassword={() => {
          // TODO: Implement forgot password flow
          console.log('Forgot password pressed');
        }}
      />
    );
  }

  return <MainNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}