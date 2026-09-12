import { NotFoundError } from '../../lib/errors.ts';
import type { Customer } from '../../domain/customer/customer.entity.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';

export class GetCustomerByIdUseCase {
  constructor(private readonly repo: CustomerRepo) {}

  async execute(id: string): Promise<Customer> {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundError('Customer', id);
    return customer;
  }
}
