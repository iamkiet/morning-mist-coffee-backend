import { ForbiddenError, NotFoundError } from '../../lib/errors.ts';
import type { AuthRole } from '../../domain/auth/auth-role.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';

export class DeleteEmployeeUseCase {
  constructor(private readonly repo: EmployeeRepo) {}

  async execute(
    id: string,
    requestingUserId: string,
    requestingUserRole: AuthRole,
  ): Promise<void> {
    if (id === requestingUserId) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    if (requestingUserRole === 'staff') {
      const target = await this.repo.findById(id);
      if (target?.role === 'admin') {
        throw new ForbiddenError('Staff cannot delete an admin account');
      }
    }

    const ok = await this.repo.delete(id);
    if (!ok) throw new NotFoundError('Employee', id);
  }
}
