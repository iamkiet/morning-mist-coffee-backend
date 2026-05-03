import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((v) => v === 'true');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  DATABASE_URL: z.string().url(),

  AUTH_JWT_SECRET: z.string().min(32),
  AUTH_ACCESS_TOKEN_TTL: z.string().min(1),
  AUTH_REFRESH_TOKEN_TTL: z.string().min(1),

  CORS_ORIGINS: z.string().min(1),
  USER_REGISTRATION_KEY: z.string().min(32),

  AUTH_LOGIN_RATE_MAX: z.coerce.number().int().positive(),
  AUTH_LOGIN_RATE_WINDOW: z.string().min(1),

  COOKIE_SECURE: booleanString,
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']),
  EXPOSE_INTERNAL_ERRORS: booleanString,
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
