import { UnauthorizedError } from '../../lib/errors.ts';
import { ROLE_CUSTOMER, type AuthRole } from '../../domain/auth/auth-role.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';
import {
  customerToAuthAccount,
  employeeToAuthAccount,
} from './to-auth-account.ts';
import type { AuthAccount } from './types.ts';

export class GetCurrentUserUseCase {
  constructor(
    private readonly employees: EmployeeRepo,
    private readonly customers: CustomerRepo,
  ) {}

  async execute(id: string, role: AuthRole): Promise<AuthAccount> {
    if (role === ROLE_CUSTOMER) {
      const customer = await this.customers.findById(id);
      if (!customer) throw new UnauthorizedError('Account no longer exists');
      return customerToAuthAccount(customer);
    }

    const employee = await this.employees.findById(id);
    if (!employee) throw new UnauthorizedError('Account no longer exists');
    return employeeToAuthAccount(employee);
  }
}
