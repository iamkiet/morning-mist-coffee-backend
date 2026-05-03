import type {
  ListProductsFilter,
  Product,
} from '../../domain/product/product.entity.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';
import type { Paginated } from '../../domain/shared/pagination.js';

export class ListProductsUseCase {
  constructor(private readonly repo: ProductRepo) {}

  async execute(filter: ListProductsFilter): Promise<Paginated<Product>> {
    const { sortBy: _sortBy, sortDir: _sortDir, limit: _limit, offset: _offset, ...criteria } =
      filter;
    const [items, total] = await Promise.all([
      this.repo.list(filter),
      this.repo.count(criteria),
    ]);
    return { items, total, limit: filter.limit, offset: filter.offset };
  }
}
