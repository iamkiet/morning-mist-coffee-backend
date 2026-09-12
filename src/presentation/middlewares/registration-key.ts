import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { ForbiddenError } from '../../lib/errors.ts';

export function createRegistrationKeyChecker(
  headerName: string,
  getExpectedKey: () => string,
): (req: FastifyRequest) => Promise<void> {
  return async (req: FastifyRequest): Promise<void> => {
    const provided = req.headers[headerName];
    if (typeof provided !== 'string' || provided.length === 0) {
      throw new ForbiddenError('Registration key required');
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(getExpectedKey());

    const lengthMatch = a.length === b.length;
    const compareWith = lengthMatch ? b : a;
    const equal = timingSafeEqual(a, compareWith);

    if (!lengthMatch || !equal) {
      throw new ForbiddenError('Invalid registration key');
    }
  };
}
