import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '@/config';
import { AuthRepository } from './auth.repository';
import { UnauthorizedError, NotFoundError } from '@/shared/errors';
import { AuthTokens, UserResponse } from './auth.types';
import { JwtPayload } from '@/middlewares/auth.middleware';

export class AuthService {
  constructor(private authRepository: AuthRepository) { }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.authRepository.findUserByEmail(email);

    // Generic error to avoid user enumeration
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is inactive');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(refresh_token: string): Promise<AuthTokens> {
    const token_hash = await this.authRepository.hashToken(refresh_token);
    const storedToken = await this.authRepository.findrefresh_token(token_hash);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(storedToken.user_id);

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid user');
    }

    // Revoke the old refresh token (rotation)
    await this.authRepository.revokerefresh_token(storedToken.id);

    // Generate new tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(refresh_token: string): Promise<void> {
    const token_hash = await this.authRepository.hashToken(refresh_token);
    const storedToken = await this.authRepository.findrefresh_token(token_hash);

    if (storedToken) {
      await this.authRepository.revokerefresh_token(storedToken.id);
    }
  }

  async getCurrentUser(user_id: string): Promise<UserResponse> {
    const user = await this.authRepository.findUserById(user_id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      is_active: user.is_active,
      createdAt: user.created_at,
    };
  }

  private async generateTokens(
    user_id: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      user_id,
      email,
      role: role as any,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as string | number,
    } as jwt.SignOptions);

    // Generate a random refresh token
    const refresh_token = randomBytes(64).toString('hex');
    const token_hash = await this.authRepository.hashToken(refresh_token);

    // Calculate expiration
    const expires_at = new Date();
    const days = parseInt(config.jwt.refreshExpiresIn.replace('d', ''), 10);
    expires_at.setDate(expires_at.getDate() + days);

    // Store refresh token
    await this.authRepository.createrefresh_token({
      user_id,
      token_hash: token_hash,
      expires_at,
    });

    return {
      accessToken,
      refresh_token,
    };
  }
}
