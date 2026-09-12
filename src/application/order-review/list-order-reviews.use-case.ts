import type {
  ListOrderReviewsFilter,
  OrderReview,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';
import type { Paginated } from '../../domain/shared/pagination.ts';

export class ListOrderReviewsUseCase {
  constructor(private readonly repo: OrderReviewRepo) {}

  async execute(
    filter: ListOrderReviewsFilter,
  ): Promise<Paginated<OrderReview>> {
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
