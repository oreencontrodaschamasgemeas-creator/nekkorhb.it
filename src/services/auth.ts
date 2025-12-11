import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { apiClient } from './api';
import { BiometricAuthResult, LoginCredentials, RegisterData, User, AuthToken } from '@/types';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      const token = await apiClient.login(credentials.email, credentials.password);
      return token;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const user = await apiClient.post<User>('/auth/register', userData);
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const user = await apiClient.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  // Biometric authentication methods
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return false;
    }
  }

  async authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return {
          success: false,
          error: 'Biometric hardware not available',
        };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return {
          success: false,
          error: 'No biometric data enrolled',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
      });

      return {
        success: result.success,
        error: result.error,
        biometricType: result.biometryType,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  async setupBiometricAuth(password: string): Promise<boolean> {
    try {
      const authResult = await this.authenticateWithBiometric();
      if (!authResult.success) {
        return false;
      }

      // Store biometric preference
      const biometricKey = await this.generateBiometricKey(password);
      await apiClient.put('/profile/biometric', {
        enabled: true,
        key: biometricKey,
        type: authResult.biometricType,
      });

      return true;
    } catch (error) {
      console.error('Failed to setup biometric auth:', error);
      return false;
    }
  }

  private async generateBiometricKey(data: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + 'salt',
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return hash;
    } catch (error) {
      console.error('Failed to generate biometric key:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.put('/profile/password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Failed to request password reset:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();