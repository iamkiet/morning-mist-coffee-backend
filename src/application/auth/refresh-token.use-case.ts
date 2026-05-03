import { UnauthorizedError } from '../../lib/errors.js';
import type { TokenSigner } from '../../domain/ports/token-signer.port.js';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.js';
import type { UserRepo } from '../../domain/user/user.repo.js';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly users: UserRepo,
    private readonly refreshTokens: RefreshTokenRepo,
    private readonly tokens: TokenSigner,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    const claims = await this.tokens.verifyRefresh(input.refreshToken);

    const stored = await this.refreshTokens.findById(claims.jti);
    if (!stored) throw new UnauthorizedError('Refresh token not recognized');
    if (stored.revokedAt) throw new UnauthorizedError('Refresh token revoked');
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token expired');
    }
    if (stored.userId !== claims.sub) {
      throw new UnauthorizedError('Refresh token user mismatch');
    }

    const user = await this.users.findById(claims.sub);
    if (!user) throw new UnauthorizedError('User no longer exists');

    await this.refreshTokens.revoke(stored.id);

    const accessToken = await this.tokens.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const next = await this.tokens.signRefresh(user.id);
    await this.refreshTokens.create({
      id: next.jti,
      userId: user.id,
      expiresAt: next.expiresAt,
    });

    return { accessToken, refreshToken: next.token, refreshExpiresAt: next.expiresAt };
  }
}
