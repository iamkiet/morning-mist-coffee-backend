import { NotFoundError } from '../../lib/errors.ts';
import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { attachStockOne } from './attach-stock.ts';

export class GetProductBySlugUseCase {
  constructor(
    private readonly repo: ProductRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw new NotFoundError('Product', slug);
    return attachStockOne(this.stock, product);
  }
}
