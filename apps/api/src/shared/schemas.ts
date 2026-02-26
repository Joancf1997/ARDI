import { z } from 'zod';
import { UserRole, MessageRole, MessageType, ContentFormat } from '@prisma/client';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// User Schemas
export const userFilterSchema = z.object({
  role: z.enum([UserRole.ADMIN, UserRole.USER]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum([UserRole.ADMIN, UserRole.USER]).default(UserRole.USER),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.omit({ password: true }).partial();

// Conversation Schemas 
export const createConversationSchema = z.object({
  title: z.string().max(255).optional(),
})
export const updateConversationSchema = createConversationSchema.partial();

export const userMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string(),
  sequence: z.number().int().positive(),
  role: z.nativeEnum(MessageRole),
  type: z.nativeEnum(MessageType),
  format: z.nativeEnum(ContentFormat),
  metadata: z.unknown().optional(),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type UserMessageInput = z.infer<typeof userMessageSchema>;

