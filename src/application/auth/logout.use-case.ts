import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';

export interface LogoutInput {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepo,
    private readonly tokens: TokenSigner,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const claims = await this.tokens.verifyRefresh(input.refreshToken);
    await this.refreshTokens.revoke(claims.jti);
  }
}
