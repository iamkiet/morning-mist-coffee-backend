import { UnauthorizedError } from '../../lib/errors.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';
import {
  customerToAuthAccount,
  employeeToAuthAccount,
} from './to-auth-account.ts';

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
    private readonly employees: EmployeeRepo,
    private readonly customers: CustomerRepo,
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

    const account =
      stored.accountType === 'employee'
        ? await this.employees.findById(claims.sub).then((e) => e && employeeToAuthAccount(e))
        : await this.customers.findById(claims.sub).then((c) => c && customerToAuthAccount(c));
    if (!account) throw new UnauthorizedError('Account no longer exists');
    if (account.status !== 'active') {
      throw new UnauthorizedError('Account is no longer active');
    }

    await this.refreshTokens.revoke(stored.id);

    const accessToken = await this.tokens.signAccess({
      sub: account.id,
      email: account.email,
      role: account.role,
    });
    const next = await this.tokens.signRefresh(account.id);
    await this.refreshTokens.create({
      id: next.jti,
      userId: account.id,
      accountType: stored.accountType,
      expiresAt: next.expiresAt,
    });

    void this.refreshTokens.deleteStale(new Date());

    return {
      accessToken,
      refreshToken: next.token,
      refreshExpiresAt: next.expiresAt,
    };
  }
}
