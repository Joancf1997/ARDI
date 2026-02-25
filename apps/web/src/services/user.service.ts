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


export const userService = { 
  async getAll(params?: { role?: UserRole; page?: number; limit?: number }): Promise<userServiceResponse> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  }
}