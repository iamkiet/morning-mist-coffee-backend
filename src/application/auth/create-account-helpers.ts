import { ConflictError } from '../../lib/errors.ts';
import { normalizeEmail } from '../../domain/shared/email.ts';

export async function resolveNewAccountEmail(
  email: string,
  findByEmail: (email: string) => Promise<unknown>,
): Promise<string> {
  const normalized = normalizeEmail(email);
  const existing = await findByEmail(normalized);
  if (existing) throw new ConflictError('Email already registered');
  return normalized;
}
