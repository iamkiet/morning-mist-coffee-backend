import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { env } from '../../config/env.ts';
import { ForbiddenError } from '../../lib/errors.ts';

const HEADER = 'x-user-registration-key';

export async function checkRegistrationKey(req: FastifyRequest): Promise<void> {
  const provided = req.headers[HEADER];
  if (typeof provided !== 'string' || provided.length === 0) {
    throw new ForbiddenError('Registration key required');
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(env.USER_REGISTRATION_KEY);

  const lengthMatch = a.length === b.length;
  const compareWith = lengthMatch ? b : a;
  const equal = timingSafeEqual(a, compareWith);

  if (!lengthMatch || !equal) {
    throw new ForbiddenError('Invalid registration key');
  }
}

