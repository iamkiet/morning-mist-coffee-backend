import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { RATE_LIMIT_AUTH } from '../middlewares/rate-limits.ts';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller.ts';
import { AuthResponse, LoginBody, MeResponse, RefreshResponse } from '../schemas/auth.schema.ts';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new AuthController(app.useCases.auth);

  fastify.post('/employee-login', {
    config: RATE_LIMIT_AUTH,
    schema: {
      tags: ['auth'],
      body: LoginBody,
      response: { 200: AuthResponse },
    },
    handler: controller.employeeLogin,
  });

  fastify.post('/customer-login', {
    config: RATE_LIMIT_AUTH,
    schema: {
      tags: ['auth'],
      body: LoginBody,
      response: { 200: AuthResponse },
    },
    handler: controller.customerLogin,
  });

  fastify.post('/refresh', {
    config: RATE_LIMIT_AUTH,
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
