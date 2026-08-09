import { LockedError, UnauthorizedError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import {
  LOGIN_LOCKOUT_MS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  normalizeEmail,
} from '../../domain/user/user.entity.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';
import type { AuthResult } from './types.ts';

export interface LoginUserInput {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepo,
    private readonly refreshTokens: RefreshTokenRepo,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenSigner,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new LockedError(
        'Account temporarily locked due to too many failed login attempts',
      );
    }

    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil =
        attempts >= MAX_FAILED_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOGIN_LOCKOUT_MS)
          : null;
      await this.users.recordFailedLogin(user.id, lockedUntil);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.failedLoginAttempts > 0) {
      await this.users.resetFailedLogins(user.id);
    }

    const accessToken = await this.tokens.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refresh = await this.tokens.signRefresh(user.id);
    await this.refreshTokens.create({
      id: refresh.jti,
      userId: user.id,
      expiresAt: refresh.expiresAt,
    });

    return {
      user,
      accessToken,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
    };
  }
}
