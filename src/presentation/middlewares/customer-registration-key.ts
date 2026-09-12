import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { env } from '../../config/env.ts';
import { ForbiddenError } from '../../lib/errors.ts';

const HEADER = 'x-customer-registration-key';

// Anti-spam gate for creating a customer account — required on every call,
// whether it's a public storefront self-registration or an admin/staff
// creating one on a customer's behalf from mist-ops. The caller (human) types
// this code in by hand; there is no way around entering it.
export async function checkCustomerRegistrationKey(req: FastifyRequest): Promise<void> {
  const provided = req.headers[HEADER];
  if (typeof provided !== 'string' || provided.length === 0) {
    throw new ForbiddenError('Registration key required');
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(env.CUSTOMER_REGISTRATION_KEY);

  const lengthMatch = a.length === b.length;
  const compareWith = lengthMatch ? b : a;
  const equal = timingSafeEqual(a, compareWith);

  if (!lengthMatch || !equal) {
    throw new ForbiddenError('Invalid registration key');
  }
}
