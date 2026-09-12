import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from '../../config/env.ts';
import { AuthController } from '../controllers/auth.controller.ts';
import { AuthResponse, LoginBody, MeResponse, RefreshResponse } from '../schemas/auth.schema.ts';

const authRateLimit = {
  rateLimit: {
    max: env.AUTH_LOGIN_RATE_MAX,
    timeWindow: env.AUTH_LOGIN_RATE_WINDOW,
  },
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new AuthController(app.useCases.auth);

  fastify.post('/employee-login', {
    config: authRateLimit,
    schema: {
      tags: ['auth'],
      body: LoginBody,
      response: { 200: AuthResponse },
    },
    handler: controller.employeeLogin,
  });

  fastify.post('/customer-login', {
    config: authRateLimit,
    schema: {
      tags: ['auth'],
      body: LoginBody,
      response: { 200: AuthResponse },
    },
    handler: controller.customerLogin,
  });

  fastify.post('/refresh', {
    config: authRateLimit,
    schema: {
      tags: ['auth'],
      response: { 200: RefreshResponse },
    },
    handler: controller.refresh,
  });

  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      response: { 204: z.null() },
    },
    handler: controller.logout,
  });

  fastify.get('/me', {
    onRequest: app.authenticate,
    schema: {
      tags: ['auth'],
      response: { 200: MeResponse },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.me,
  });
}
