import apiClient from './api';
import { User, UserRole } from '@/services/auth.service';

export interface userServiceResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserPayload {
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const userService = {
  async getAll(params?: { role?: UserRole; page?: number; limit?: number }): Promise<userServiceResponse> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async create(data: CreateUserPayload): Promise<User> {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateUserPayload): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};