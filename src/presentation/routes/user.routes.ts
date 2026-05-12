import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { UserController } from '../controllers/user.controller.js';
import {
  ListUsersQuery,
  UpdatePasswordBody,
  UpdateUserBody,
  UserIdParam,
  UserListResponse,
  UserSchema,
} from '../schemas/user.schema.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new UserController(app.useCases.user);

  fastify.get('/', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['users'],
      querystring: ListUsersQuery,
      response: { 200: UserListResponse },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.list,
  });

  fastify.patch('/:id', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['users'],
      params: UserIdParam,
      body: UpdateUserBody,
      response: { 200: UserSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.update,
  });

  fastify.patch('/:id/password', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['users'],
      params: UserIdParam,
      body: UpdatePasswordBody,
      response: { 204: { type: 'null' } },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.updatePassword,
  });
}
