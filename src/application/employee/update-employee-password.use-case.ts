import { NotFoundError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { Employee } from '../../domain/employee/employee.entity.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';

export class UpdateEmployeePasswordUseCase {
  constructor(
    private readonly repo: EmployeeRepo,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(id: string, newPassword: string): Promise<Employee> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Employee', id);
    const passwordHash = await this.hasher.hash(newPassword);
    const updated = await this.repo.updatePassword(id, passwordHash);
    if (!updated) throw new NotFoundError('Employee', id);
    return updated;
  }
}
