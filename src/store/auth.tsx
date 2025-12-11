import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/auth';
import { User, AuthToken, LoginCredentials } from '@/types';

interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricEnabled: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: AuthToken } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_BIOMETRIC'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  biometricEnabled: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_BIOMETRIC':
      return {
        ...state,
        biometricEnabled: action.payload,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setupBiometric: (password: string) => Promise<boolean>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Check for stored token
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (!storedToken) {
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      const token: AuthToken = JSON.parse(storedToken);
      
      // Check if token is still valid
      if (new Date() >= new Date(token.expiresAt)) {
        await SecureStore.deleteItemAsync('authToken');
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      // Get current user
      const user = await authService.getCurrentUser();
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      dispatch({ type: 'AUTH_FAILURE' });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const token = await authService.login(credentials);
      const user = await authService.getCurrentUser();
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      console.error('Login failed:', error);
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshUser = async () => {
    try {
      if (state.isAuthenticated && state.user) {
        const user = await authService.getCurrentUser();
        dispatch({ type: 'UPDATE_USER', payload: user });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const setupBiometric = async (password: string): Promise<boolean> => {
    try {
      const success = await authService.setupBiometricAuth(password);
      if (success) {
        dispatch({ type: 'SET_BIOMETRIC', payload: true });
      }
      return success;
    } catch (error) {
      console.error('Failed to setup biometric:', error);
      return false;
    }
  };

  const enableBiometric = async () => {
    dispatch({ type: 'SET_BIOMETRIC', payload: true });
  };

  const disableBiometric = async () => {
    dispatch({ type: 'SET_BIOMETRIC', payload: false });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    setupBiometric,
    enableBiometric,
    disableBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}