import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '@/constants/config';
import { AuthToken, ApiResponse, PaginatedResponse } from '@/types';

export class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAuthToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearStoredToken();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async getStoredToken(): Promise<AuthToken | null> {
    try {
      const tokenData = await SecureStore.getItemAsync('authToken');
      return tokenData ? JSON.parse(tokenData) : null;
    } catch (error) {
      console.error('Failed to retrieve stored token:', error);
      return null;
    }
  }

  private async storeToken(token: AuthToken): Promise<void> {
    try {
      await SecureStore.setItemAsync('authToken', JSON.stringify(token));
    } catch (error) {
      console.error('Failed to store token:', error);
      throw error;
    }
  }

  private async clearStoredToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (error) {
      console.error('Failed to clear stored token:', error);
    }
  }

  private async refreshAuthToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshToken();
    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async doRefreshToken(): Promise<string> {
    try {
      const currentToken = await this.getStoredToken();
      if (!currentToken?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.auth.refresh}`, {
        refreshToken: currentToken.refreshToken,
      });

      const { accessToken, refreshToken, expiresAt } = response.data.data;
      const newToken: AuthToken = {
        accessToken,
        refreshToken,
        expiresAt: new Date(expiresAt),
        tokenType: 'Bearer',
      };

      await this.storeToken(newToken);
      return accessToken;
    } catch (error) {
      await this.clearStoredToken();
      throw error;
    }
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data!;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data!;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data!;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data!;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data!;
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthToken> {
    const response = await this.post<AuthToken>(API_CONFIG.endpoints.auth.login, {
      email,
      password,
    });
    
    const token: AuthToken = {
      ...response,
      expiresAt: new Date(response.expiresAt),
    };
    
    await this.storeToken(token);
    return token;
  }

  async logout(): Promise<void> {
    try {
      await this.post(API_CONFIG.endpoints.auth.logout);
    } finally {
      await this.clearStoredToken();
    }
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/profile');
  }

  // Utility methods
  setBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  setTimeout(timeout: number) {
    this.client.defaults.timeout = timeout;
  }
}

// Singleton instance
export const apiClient = new ApiClient();