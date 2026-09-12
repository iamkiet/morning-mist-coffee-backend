import type {
  ListProductReviewsFilter,
  ProductReview,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';
import type { Paginated } from '../../domain/shared/pagination.ts';

export class ListProductReviewsUseCase {
  constructor(private readonly repo: ProductReviewRepo) {}

  async execute(
    filter: ListProductReviewsFilter,
  ): Promise<Paginated<ProductReview>> {
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
