import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../../lib/errors.js';
import type { UserRole } from '../../domain/user/user.entity.js';
import { ACCESS_COOKIE } from './auth-cookies.js';

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
  const cookieToken = req.cookies[ACCESS_COOKIE];
  if (cookieToken && cookieToken.length > 0) return cookieToken;
  return null;
}

export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = extractAccessToken(req);
  if (!token) throw new UnauthorizedError('Missing access token');

  const claims = await req.server.tokenSigner.verifyAccess(token);
  req.user = { id: claims.sub, email: claims.email, role: claims.role };
}

export function requireRole(role: UserRole) {
  return async function check(req: FastifyRequest): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role !== role) {
      throw new UnauthorizedError(`Role '${role}' required`);
    }
  };
}
