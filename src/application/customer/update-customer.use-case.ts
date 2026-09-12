import { NotFoundError } from '../../lib/errors.ts';
import type {
  Customer,
  UpdateCustomerInput,
} from '../../domain/customer/customer.entity.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';

export class UpdateCustomerUseCase {
  constructor(private readonly repo: CustomerRepo) {}

  async execute(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('Customer', id);
    return updated;
  }
}
