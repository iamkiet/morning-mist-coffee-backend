import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import type { ProductStock } from '../../domain/product/product-stock.entity.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export interface DecreaseStockInput {
  quantity: number;
}

export class DecreaseStockUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(productId: string, input: DecreaseStockInput): Promise<ProductStock> {
    if (input.quantity <= 0) throw new ValidationError('quantity must be positive');
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundError('Product', productId);

    const updated = await this.stock.tryDecrease(productId, input.quantity);
    if (!updated) throw new ConflictError('Insufficient stock');
    return updated;
  }
}
