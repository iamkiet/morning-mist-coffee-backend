import { ForbiddenError, NotFoundError } from '../../lib/errors.ts';
import { ROLE_ADMIN, ROLE_STAFF, type AuthRole } from '../../domain/auth/auth-role.ts';
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

    if (requestingUserRole === ROLE_STAFF) {
      const target = await this.repo.findById(id);
      if (target?.role === ROLE_ADMIN) {
        throw new ForbiddenError('Staff cannot delete an admin account');
      }
    }

    const ok = await this.repo.delete(id);
    if (!ok) throw new NotFoundError('Employee', id);
  }
}
