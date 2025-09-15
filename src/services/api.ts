import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Use your Replit backend URL - UPDATED for current deployment
const API_BASE_URL = 'https://4bccefca-e72e-4637-8984-305b73f30f6d-00-x53yc5gqc13k.riker.replit.dev/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync('auth_token');
    const userId = await SecureStore.getItemAsync('user_id');
    // Backend expects x-demo-auth header with user ID, not Bearer token
    return userId ? { 'x-demo-auth': userId } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const authHeaders = await this.getAuthHeader();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    console.log(`API Request: ${config.method || 'GET'} ${url}`);

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API Error: ${response.status} - ${errorData}`);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  // Authentication
  async login(username: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(userData: any) {
    console.log('API register called with:', userData);
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/user');
  }

  // Breakdown Requests
  async getBreakdownRequests() {
    return this.request<any[]>('/requests/active');
  }

  async getUserRequests(userId: number) {
    return this.request<any[]>(`/requests/truck-owner/${userId}`);
  }

  async getMechanicRequests(userId: number) {
    return this.request<any[]>(`/requests/mechanic/${userId}`);
  }

  async createBreakdownRequest(requestData: any) {
    return this.request<any>('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async acceptBreakdownRequest(requestId: number, mechanicId: number) {
    return this.request<any>(`/requests/${requestId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ mechanicId }),
    });
  }

  async updateRequestStatus(requestId: number, status: string) {
    return this.request<any>(`/requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Messages
  async getMessages(requestId: number) {
    return this.request<any[]>(`/messages/request/${requestId}`);
  }

  async sendMessage(messageData: any) {
    return this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // Notifications  
  async registerPushToken(token: string) {
    // Get current user for userId
    const userId = await SecureStore.getItemAsync('user_id');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.request<any>('/push-tokens', {
      method: 'POST', 
      body: JSON.stringify({
        userId: parseInt(userId),
        token: token,
        platform: Platform.OS, // 'android' or 'ios' auto-detected
        isActive: true
      }),
    });
  }

  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  // User Profile
  async updateProfile(profileData: any) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

}

export const apiService = new ApiService();