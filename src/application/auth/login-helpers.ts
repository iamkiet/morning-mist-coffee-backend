import { LockedError, UnauthorizedError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import {
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOGIN_LOCKOUT_MS,
  type AccountType,
} from '../../domain/auth/auth-role.ts';
import type { AuthAccount, AuthResult } from './types.ts';

export interface Lockable {
  id: string;
  passwordHash: string | null;
  lockedUntil: Date | null;
  failedLoginAttempts: number;
  status: 'active' | 'inactive' | 'banned';
}

export interface LockableRepo {
  recordFailedLogin(id: string, lockedUntil: Date | null): Promise<unknown>;
  resetFailedLogins(id: string): Promise<void>;
}

export async function verifyPassword(
  account: Lockable,
  repo: LockableRepo,
  password: string,
  hasher: PasswordHasher,
): Promise<void> {
  if (!account.passwordHash || account.status !== 'active') {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
    throw new LockedError(
      'Account temporarily locked due to too many failed login attempts',
    );
  }

  const ok = await hasher.verify(password, account.passwordHash);
  if (!ok) {
    const attempts = account.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOGIN_LOCKOUT_MS)
        : null;
    await repo.recordFailedLogin(account.id, lockedUntil);
    throw new UnauthorizedError('Invalid email or password');
  }

  if (account.failedLoginAttempts > 0) {
    await repo.resetFailedLogins(account.id);
  }
}

export async function issueTokens(
  refreshTokens: RefreshTokenRepo,
  tokens: TokenSigner,
  id: string,
  accountType: AccountType,
  account: AuthAccount,
): Promise<AuthResult> {
  const accessToken = await tokens.signAccess({
    sub: id,
    email: account.email,
    role: account.role,
  });
  const refresh = await tokens.signRefresh(id);
  await refreshTokens.revokeAllForUser(id);
  await refreshTokens.create({
    id: refresh.jti,
    userId: id,
    accountType,
    expiresAt: refresh.expiresAt,
  });

  return {
    user: account,
    accessToken,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.expiresAt,
  };
}
