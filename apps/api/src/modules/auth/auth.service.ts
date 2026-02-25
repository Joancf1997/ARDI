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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = await this.authRepository.hashToken(refreshToken);
    const storedToken = await this.authRepository.findrefresh_token(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(storedToken.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid user');
    }

    // Revoke the old refresh token (rotation)
    await this.authRepository.revokerefresh_token(storedToken.id);

    // Generate new tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = await this.authRepository.hashToken(refreshToken);
    const storedToken = await this.authRepository.findrefresh_token(tokenHash);

    if (storedToken) {
      await this.authRepository.revokerefresh_token(storedToken.id);
    }
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      userId,
      email,
      role: role as any,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as string | number,
    } as jwt.SignOptions);

    // Generate a random refresh token
    const refreshToken = randomBytes(64).toString('hex');
    const tokenHash = await this.authRepository.hashToken(refreshToken);

    // Calculate expiration
    const expiresAt = new Date();
    const days = parseInt(config.jwt.refreshExpiresIn.replace('d', ''), 10);
    expiresAt.setDate(expiresAt.getDate() + days);

    // Store refresh token
    await this.authRepository.createrefresh_token({
      userId,
      tokenHash: tokenHash,
      expiresAt: expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
