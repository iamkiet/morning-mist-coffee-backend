import { ForbiddenError, NotFoundError } from '../../lib/errors.ts';
import type {
  Employee,
  UpdateEmployeeInput,
} from '../../domain/employee/employee.entity.ts';
import { ROLE_ADMIN, ROLE_STAFF, type AuthRole } from '../../domain/auth/auth-role.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';

export class UpdateEmployeeUseCase {
  constructor(private readonly repo: EmployeeRepo) {}

  async execute(
    id: string,
    input: UpdateEmployeeInput,
    actingRole: AuthRole,
  ): Promise<Employee> {
    if (actingRole === ROLE_STAFF && input.role === ROLE_ADMIN) {
      throw new ForbiddenError('Staff cannot grant the admin role');
    }

    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('Employee', id);
    return updated;
  }
}
