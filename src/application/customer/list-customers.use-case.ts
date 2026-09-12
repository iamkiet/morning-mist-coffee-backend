import type { Paginated } from '../../domain/shared/pagination.ts';
import type {
  Customer,
  CustomerFilterCriteria,
  ListCustomersFilter,
} from '../../domain/customer/customer.entity.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';

export class ListCustomersUseCase {
  constructor(private readonly repo: CustomerRepo) {}

  async execute(filter: ListCustomersFilter): Promise<Paginated<Customer>> {
    const { sortBy: _sortBy, sortDir: _sortDir, limit, offset, ...criteria } = filter;
    const [items, total] = await Promise.all([
      this.repo.list(filter),
      this.repo.count(criteria as CustomerFilterCriteria),
    ]);
    return { items, total, limit, offset };
  }
}
