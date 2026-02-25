import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

export const refresh_tokenSchema = z.object({
  refresh_token: z.string(),
});

// Types
export type LoginInput = z.infer<typeof loginSchema>;
export type refresh_tokenInput = z.infer<typeof refresh_tokenSchema>;
