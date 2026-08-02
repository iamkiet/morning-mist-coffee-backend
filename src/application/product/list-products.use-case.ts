import type {
  ListProductsFilter,
  Product,
} from '../../domain/product/product.entity.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { Paginated } from '../../domain/shared/pagination.ts';
import { attachStock } from './attach-stock.ts';

export class ListProductsUseCase {
  constructor(
    private readonly repo: ProductRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(filter: ListProductsFilter): Promise<Paginated<Product>> {
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
      items: await attachStock(this.stock, items),
      total,
      limit: filter.limit,
      offset: filter.offset,
    };
  }
}
