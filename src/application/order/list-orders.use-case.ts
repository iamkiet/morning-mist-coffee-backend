import type {
  ListOrdersFilter,
  Order,
} from '../../domain/order/order.entity.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';
import type { Paginated } from '../../domain/shared/pagination.ts';

export class ListOrdersUseCase {
  constructor(private readonly repo: OrderRepo) {}

  async execute(filter: ListOrdersFilter): Promise<Paginated<Order>> {
    const {
      sortBy: _sortBy,
      sortDir: _sortDir,
      limit: _limit,
      offset: _offset,
      ...criteria
    } = filter;
    const [items, total] = await Promise.all([
      this.repo.list(filter),
      this.repo.count(criteria),
    ]);
    return { items, total, limit: filter.limit, offset: filter.offset };
  }
}
