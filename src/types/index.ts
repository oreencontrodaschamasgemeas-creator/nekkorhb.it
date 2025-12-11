// Core types for the Resident App

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  role: 'resident' | 'admin' | 'security';
  avatar?: string;
  lastLogin: Date;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
  purpose: string;
  status: 'pending' | 'approved' | 'denied' | 'checked-in' | 'checked-out';
  expectedArrival: Date;
  actualArrival?: Date;
  actualDeparture?: Date;
  hostId: string;
  hostName: string;
  notes?: string;
  photo?: string;
  qrCode: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  type: 'entry' | 'exit';
  method: 'qr' | 'facial' | 'pin' | 'biometric' | 'manual';
  location: string;
  timestamp: Date;
  success: boolean;
  deviceInfo?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'visitor' | 'security' | 'system' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface SecurityTip {
  id: string;
  title: string;
  content: string;
  category: 'prevention' | 'awareness' | 'emergency' | 'technology';
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  readBy: string[];
  imageUrl?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  unit: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}