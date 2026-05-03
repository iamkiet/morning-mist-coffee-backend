import { NotFoundError, ValidationError } from '../../lib/errors.js';
import type { ProductStock } from '../../domain/product/product-stock.entity.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export interface IncreaseStockInput {
  quantity: number;
}

export class IncreaseStockUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(productId: string, input: IncreaseStockInput): Promise<ProductStock> {
    if (input.quantity <= 0) throw new ValidationError('quantity must be positive');
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundError('Product', productId);
    return this.stock.increase(productId, input.quantity);
  }
}
