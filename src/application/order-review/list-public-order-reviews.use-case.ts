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
    const [items, total] = await Promise.all([
      this.repo.listPublic(filter.productId, filter.limit, filter.offset),
      this.repo.countPublic(filter.productId),
    ]);
    return { items, total, limit: filter.limit, offset: filter.offset };
  }
}
