import { timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError } from '../../lib/errors.ts';
import { ACCESS_COOKIE, CSRF_COOKIE } from './auth-cookies.ts';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_HEADER = 'x-csrf-token';

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function csrfProtection(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (SAFE_METHODS.has(req.method)) return;

  // No ambient session cookie: caller authenticates purely via Bearer header
  // (not automatically replayable by a third-party site), so CSRF doesn't apply.
  if (!req.cookies[ACCESS_COOKIE]) return;

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (
    !cookieToken ||
    typeof headerToken !== 'string' ||
    !tokensMatch(cookieToken, headerToken)
  ) {
    throw new ForbiddenError('Invalid or missing CSRF token');
  }
}
