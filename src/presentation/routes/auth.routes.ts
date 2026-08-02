import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '../../config/env.ts';
import { AuthController } from '../controllers/auth.controller.ts';
import { checkRegistrationKey } from '../middlewares/registration-key.ts';
import { aiSecurityGuard } from '../middlewares/ai-security.middleware.ts';
import {
  AuthResponse,
  LoginBody,
  RefreshBody,
  RefreshResponse,
  RegisterBody,
  UserSchema,
} from '../schemas/auth.schema.ts';

const authRateLimit = {
  rateLimit: {
    max: env.AUTH_LOGIN_RATE_MAX,
    timeWindow: env.AUTH_LOGIN_RATE_WINDOW,
  },
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new AuthController(app.useCases.auth);

  fastify.post('/register', {
    config: authRateLimit,
    schema: {
      tags: ['auth'],
      body: RegisterBody,
      response: { 201: AuthResponse },
    },
    preHandler: [checkRegistrationKey, aiSecurityGuard('/register')],
    handler: controller.register,
  });

  fastify.post('/login', {
    config: authRateLimit,
    schema: {
      tags: ['auth'],
      body: LoginBody,
      response: { 200: AuthResponse },
    },
    preHandler: [aiSecurityGuard('/login')],
    handler: controller.login,
  });

  fastify.post('/refresh', {
    config: authRateLimit,
    schema: {
      tags: ['auth'],
      body: RefreshBody,
      response: { 200: RefreshResponse },
    },
    handler: controller.refresh,
  });

  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      body: RefreshBody,
      response: { 204: { type: 'null' } },
    },
    handler: controller.logout,
  });

  fastify.get('/me', {
    onRequest: app.authenticate,
    schema: {
      tags: ['auth'],
      response: { 200: UserSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.me,
  });
}
