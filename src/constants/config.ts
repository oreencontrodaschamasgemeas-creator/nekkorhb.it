export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.nekkorhb.it',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      refresh: '/auth/refresh',
      logout: '/auth/logout',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },
    visitors: {
      list: '/visitors',
      create: '/visitors',
      update: '/visitors/{id}',
      delete: '/visitors/{id}',
      approve: '/visitors/{id}/approve',
      deny: '/visitors/{id}/deny',
      qrCode: '/visitors/{id}/qr',
    },
    access: {
      logs: '/access/logs',
      history: '/access/history',
      current: '/access/current',
    },
    notifications: {
      list: '/notifications',
      markRead: '/notifications/{id}/read',
      markAllRead: '/notifications/mark-all-read',
      settings: '/notifications/settings',
    },
    security: {
      tips: '/security/tips',
      incidents: '/security/incidents',
      report: '/security/report',
    },
    profile: {
      get: '/profile',
      update: '/profile',
      changePassword: '/profile/password',
      biometric: '/profile/biometric',
    },
  },
} as const;

export const APP_CONFIG = {
  name: 'Resident App',
  version: '1.0.0',
  buildNumber: '1',
  supportEmail: 'support@nekkorhb.it',
  features: {
    visitorManagement: true,
    accessLogs: true,
    notifications: true,
    securityTips: true,
    biometricAuth: true,
    pushNotifications: true,
  },
  limits: {
    maxVisitorsPerDay: 10,
    maxVisitorDuration: 24, // hours
    maxLogEntries: 1000,
    maxNotificationHistory: 500,
  },
} as const;