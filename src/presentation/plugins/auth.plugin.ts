import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthRole } from '../../domain/auth/auth-role.ts';
import { authenticate, requireRole } from '../middlewares/auth.ts';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      role: AuthRole | AuthRole[],
    ) => (req: FastifyRequest) => Promise<void>;
  }
}

export const authPlugin = fp(
  async (app) => {
    app.decorate('authenticate', authenticate);
    app.decorate('requireRole', requireRole);
  },
  { name: 'auth' },
);
