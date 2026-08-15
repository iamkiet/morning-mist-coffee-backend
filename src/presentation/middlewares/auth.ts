import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors.ts';
import type { UserRole } from '../../domain/user/user.entity.ts';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

function extractAccessToken(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    if (token) return token;
  }
  return null;
}

export async function authenticate(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const token = extractAccessToken(req);
  if (!token) throw new UnauthorizedError('Missing access token');

  const claims = await req.server.tokenSigner.verifyAccess(token);
  req.user = { id: claims.sub, email: claims.email, role: claims.role };
}

export function requireRole(role: UserRole) {
  return async function check(req: FastifyRequest): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role !== role) {
      throw new ForbiddenError(`Role '${role}' required`);
    }
  };
}
