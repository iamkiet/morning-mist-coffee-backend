import type { ProductReview } from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';
import type { Paginated } from '../../domain/shared/pagination.ts';

export interface ListPublicProductReviewsFilter {
  productId: string;
  limit: number;
  offset: number;
}

export class ListPublicProductReviewsUseCase {
  constructor(private readonly repo: ProductReviewRepo) {}

  async execute(
    filter: ListPublicProductReviewsFilter,
  ): Promise<Paginated<ProductReview>> {
    const [items, total] = await Promise.all([
      this.repo.listPublic(filter.productId, filter.limit, filter.offset),
      this.repo.countPublic(filter.productId),
    ]);
    return { items, total, limit: filter.limit, offset: filter.offset };
  }
}
