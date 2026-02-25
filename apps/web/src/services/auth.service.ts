import apiClient from './api';

export type UserRole = 'ADMIN' | 'USER';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<string> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data.data.accessToken;
  },

  async refresh(): Promise<string> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    return response.data.data.accessToken;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data.data;
  },
};
