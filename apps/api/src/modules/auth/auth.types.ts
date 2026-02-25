import { Role } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  shelterId: string | null;
  isActive: boolean;
  createdAt: Date;
}
