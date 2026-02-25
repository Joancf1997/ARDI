import { UserRole } from '@prisma/client';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole,
  isActive: boolean;
  createdAt: Date;
}

export interface UserListParams {
  role?: UserRole;
  page: number;
  limit: number;
}

export interface PaginatedUsers {
  data: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}
