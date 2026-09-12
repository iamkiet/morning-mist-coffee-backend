import { NotFoundError } from '../../lib/errors.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';

export class DeleteCustomerUseCase {
  constructor(private readonly repo: CustomerRepo) {}

  async execute(id: string): Promise<void> {
    const ok = await this.repo.delete(id);
    if (!ok) throw new NotFoundError('Customer', id);
  }
}
