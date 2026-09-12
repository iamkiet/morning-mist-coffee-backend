import { NotFoundError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { Customer } from '../../domain/customer/customer.entity.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';

export class UpdateCustomerPasswordUseCase {
  constructor(
    private readonly repo: CustomerRepo,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(id: string, newPassword: string): Promise<Customer> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Customer', id);
    const passwordHash = await this.hasher.hash(newPassword);
    const updated = await this.repo.updatePassword(id, passwordHash);
    if (!updated) throw new NotFoundError('Customer', id);
    return updated;
  }
}
