import { ConflictError, ForbiddenError } from '../../lib/errors.ts';
import { normalizeEmail } from '../../domain/shared/email.ts';
import type {
  Employee,
  EmployeeDepartment,
  EmployeeRole,
} from '../../domain/employee/employee.entity.ts';
import type { AuthRole } from '../../domain/auth/auth-role.ts';
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
    if (actingRole === 'staff' && input.role === 'admin') {
      throw new ForbiddenError('Staff cannot create an admin account');
    }

    const companyEmail = normalizeEmail(input.companyEmail);
    const existing = await this.repo.findByEmail(companyEmail);
    if (existing) throw new ConflictError('Email already registered');

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
