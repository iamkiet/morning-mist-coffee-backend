import { UnauthorizedError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import { normalizeEmail } from '../../domain/shared/email.ts';
import { ACCOUNT_TYPE_EMPLOYEE } from '../../domain/auth/auth-role.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';
import { employeeToAuthAccount } from './to-auth-account.ts';
import { issueTokens, verifyPassword } from './login-helpers.ts';
import type { AuthResult } from './types.ts';

export interface EmployeeLoginInput {
  email: string;
  password: string;
}

export class EmployeeLoginUseCase {
  constructor(
    private readonly employees: EmployeeRepo,
    private readonly refreshTokens: RefreshTokenRepo,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenSigner,
  ) {}

  async execute(input: EmployeeLoginInput): Promise<AuthResult> {
    const email = normalizeEmail(input.email);

    const employee = await this.employees.findByEmail(email);
    if (!employee) throw new UnauthorizedError('Invalid email or password');

    await verifyPassword(employee, this.employees, input.password, this.hasher);

    return issueTokens(
      this.refreshTokens,
      this.tokens,
      employee.id,
      ACCOUNT_TYPE_EMPLOYEE,
      employeeToAuthAccount(employee),
    );
  }
}
