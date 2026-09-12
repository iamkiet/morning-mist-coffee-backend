import { ForbiddenError, NotFoundError } from '../../lib/errors.ts';
import type {
  Employee,
  UpdateEmployeeInput,
} from '../../domain/employee/employee.entity.ts';
import type { AuthRole } from '../../domain/auth/auth-role.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';

export class UpdateEmployeeUseCase {
  constructor(private readonly repo: EmployeeRepo) {}

  async execute(
    id: string,
    input: UpdateEmployeeInput,
    actingRole: AuthRole,
    actingUserId: string,
  ): Promise<Employee> {
    if (actingRole === 'staff' && input.role === 'admin') {
      throw new ForbiddenError('Staff cannot grant the admin role');
    }

    if (actingRole === 'staff' && id !== actingUserId) {
      throw new ForbiddenError('Staff can only edit their own account');
    }

    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('Employee', id);
    return updated;
  }
}
