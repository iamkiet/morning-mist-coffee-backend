import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors.ts';
import type { AuthRole } from '../../domain/auth/auth-role.ts';
import { ACCESS_COOKIE } from './auth-cookies.ts';

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

function extractAccessToken(req: FastifyRequest): string | null {
  return req.cookies[ACCESS_COOKIE] ?? null;
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

export function requireRole(allowed: AuthRole[]) {
  return async function check(req: FastifyRequest): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    if (!allowed.includes(req.user.role)) {
      throw new ForbiddenError(`Role '${allowed.join("' or '")}' required`);
    }
  };
}
