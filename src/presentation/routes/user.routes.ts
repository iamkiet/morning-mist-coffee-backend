import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { UserController } from '../controllers/user.controller.js';
import { ListUsersQuery, UserListResponse } from '../schemas/user.schema.js';

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
}
