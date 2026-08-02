import { ConflictError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import { normalizeEmail } from '../../domain/user/user.entity.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';
import type { AuthResult } from './types.ts';

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepo,
    private readonly refreshTokens: RefreshTokenRepo,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenSigner,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);

    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      passwordHash,
    });

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
