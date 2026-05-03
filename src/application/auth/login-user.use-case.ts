import { UnauthorizedError } from '../../lib/errors.js';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.js';
import type { TokenSigner } from '../../domain/ports/token-signer.port.js';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.js';
import { normalizeEmail } from '../../domain/user/user.entity.js';
import type { UserRepo } from '../../domain/user/user.repo.js';
import type { AuthResult } from './types.js';

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

    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid email or password');

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
