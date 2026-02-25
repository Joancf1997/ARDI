import { prisma } from '@/shared/prisma';
import { user, refresh_token } from '@prisma/client';
import { createHash } from 'crypto';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<user | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findUserById(id: string): Promise<user | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createrefresh_token(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
  }): Promise<refresh_token> {
    return prisma.refresh_token.create({
      data,
    });
  }

  async findrefresh_token(token_hash: string): Promise<refresh_token | null> {
    return prisma.refresh_token.findFirst({
      where: {
        token_hash,
        revoked_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
    });
  }

  async revokerefresh_token(id: string): Promise<void> {
    await prisma.refresh_token.update({
      where: { id },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllUserrefresh_tokens(user_id: string): Promise<void> {
    await prisma.refresh_token.updateMany({
      where: {
        user_id,
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await prisma.refresh_token.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }

  async hashToken(token: string): Promise<string> {
    // SHA-256 is deterministic: perfect for DB lookups
    return createHash('sha256').update(token).digest('hex');
  }
}
