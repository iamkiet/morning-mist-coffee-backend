import { NotFoundError } from '../../lib/errors.js';
import type { Product } from '../../domain/product/product.entity.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export class GetProductBySlugUseCase {
  constructor(
    private readonly repo: ProductRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw new NotFoundError('Product', slug);
    const s = await this.stock.getByProductId(product.id);
    return { ...product, stockQuantity: s.quantity };
  }
}
