import { user_role } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refresh_token: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: user_role;
  is_active: boolean;
  createdAt: Date;
}
