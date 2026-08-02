import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../lib/errors.ts';
import type {
  ProductStock,
  StockChange,
} from '../../domain/product/product-stock.entity.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';

export class DecreaseStockUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(productId: string, input: StockChange): Promise<ProductStock> {
    if (input.quantity <= 0)
      throw new ValidationError('quantity must be positive');
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundError('Product', productId);

    const updated = await this.stock.tryDecrease(productId, input.quantity);
    if (!updated) throw new ConflictError('Insufficient stock');
    return updated;
  }
}
