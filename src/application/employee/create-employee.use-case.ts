import { ForbiddenError } from '../../lib/errors.ts';
import { resolveNewAccountEmail } from '../auth/create-account-helpers.ts';
import type {
  Employee,
  EmployeeDepartment,
  EmployeeRole,
} from '../../domain/employee/employee.entity.ts';
import { ROLE_ADMIN, ROLE_STAFF, type AuthRole } from '../../domain/auth/auth-role.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';

export interface CreateEmployeeByAdminInput {
  firstName: string;
  lastName: string;
  companyEmail: string;
  department?: EmployeeDepartment;
  password: string;
  role: EmployeeRole;
}

export class CreateEmployeeUseCase {
  constructor(
    private readonly repo: EmployeeRepo,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(
    input: CreateEmployeeByAdminInput,
    actingRole: AuthRole,
  ): Promise<Employee> {
    if (actingRole === ROLE_STAFF && input.role === ROLE_ADMIN) {
      throw new ForbiddenError('Staff cannot create an admin account');
    }

    const companyEmail = await resolveNewAccountEmail(input.companyEmail, (email) =>
      this.repo.findByEmail(email),
    );

    const passwordHash = await this.hasher.hash(input.password);
    return this.repo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      companyEmail,
      department: input.department,
      passwordHash,
      role: input.role,
    });
  }
}
