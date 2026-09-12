import type { OrderReview } from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';
import type { Paginated } from '../../domain/shared/pagination.ts';

export interface ListPublicOrderReviewsFilter {
  productId: string;
  limit: number;
  offset: number;
}

export class ListPublicOrderReviewsUseCase {
  constructor(private readonly repo: OrderReviewRepo) {}

  async execute(
    filter: ListPublicOrderReviewsFilter,
  ): Promise<Paginated<OrderReview>> {
    const criteria = { productId: filter.productId, category: 'compliment' as const };
    const [items, total] = await Promise.all([
      this.repo.list({
        ...criteria,
        sortBy: 'createdAt',
        sortDir: 'desc',
        limit: filter.limit,
        offset: filter.offset,
      }),
      this.repo.count(criteria),
    ]);
    return { items, total, limit: filter.limit, offset: filter.offset };
  }
}
