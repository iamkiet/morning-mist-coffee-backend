import type { ListProductsFilter } from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { Paginated } from '../../domain/shared/pagination.ts';
import { attachVariants } from './attach-variants.ts';

export class ListProductsUseCase {
  constructor(
    private readonly repo: ProductRepo,
    private readonly variants: ProductVariantRepo,
  ) {}

  async execute(filter: ListProductsFilter): Promise<Paginated<ProductWithVariants>> {
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
    return {
      items: await attachVariants(this.variants, items),
      total,
      limit: filter.limit,
      offset: filter.offset,
    };
  }
}
