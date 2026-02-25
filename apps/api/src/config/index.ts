import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  api: z.object({
    port: z.number().int().positive(),
    host: z.string(),
  }),
  database: z.object({
    url: z.string().url(),
  }),
  jwt: z.object({
    accessSecret: z.string().min(32),
    refreshSecret: z.string().min(32),
    accessExpiresIn: z.string(),
    refreshExpiresIn: z.string(),
  }),
  cors: z.object({
    origin: z.string(),
  }),
  rateLimit: z.object({
    windowMs: z.number().int().positive(),
    maxRequests: z.number().int().positive(),
  }),
  bcrypt: z.object({
    saltRounds: z.number().int().min(10).max(15),
  }),
});

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    host: process.env.API_HOST || '0.0.0.0',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10),
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
};

export const config = configSchema.parse(rawConfig);

export type Config = z.infer<typeof configSchema>;
