import { UnauthorizedError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import { normalizeEmail } from '../../domain/shared/email.ts';
import { ACCOUNT_TYPE_CUSTOMER } from '../../domain/auth/auth-role.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';
import { customerToAuthAccount } from './to-auth-account.ts';
import { issueTokens, verifyPassword } from './login-helpers.ts';
import type { AuthResult } from './types.ts';

export interface CustomerLoginInput {
  email: string;
  password: string;
}

export class CustomerLoginUseCase {
  constructor(
    private readonly customers: CustomerRepo,
    private readonly refreshTokens: RefreshTokenRepo,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenSigner,
  ) {}

  async execute(input: CustomerLoginInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);

    const customer = await this.customers.findByEmail(email);
    if (!customer) throw new UnauthorizedError('Invalid email or password');

    await verifyPassword(customer, this.customers, input.password, this.hasher);

    return issueTokens(
      this.refreshTokens,
      this.tokens,
      customer.id,
      ACCOUNT_TYPE_CUSTOMER,
      customerToAuthAccount(customer),
    );
  }
}
