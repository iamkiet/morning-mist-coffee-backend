import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from '../../domain/user/user.entity.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (role: UserRole) => (req: FastifyRequest) => Promise<void>;
  }
}

export const authPlugin = fp(
  async (app) => {
    app.decorate('authenticate', authenticate);
    app.decorate('requireRole', requireRole);
  },
  { name: 'auth' },
);
