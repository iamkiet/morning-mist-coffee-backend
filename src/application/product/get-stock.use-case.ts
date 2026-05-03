import { NotFoundError } from '../../lib/errors.js';
import type { ProductStock } from '../../domain/product/product-stock.entity.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export class GetStockUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(productId: string): Promise<ProductStock> {
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundError('Product', productId);
    return this.stock.getByProductId(productId);
  }
}
