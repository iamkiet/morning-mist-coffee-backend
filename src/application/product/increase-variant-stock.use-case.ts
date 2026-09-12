import { NotFoundError, ValidationError } from '../../lib/errors.ts';
import {
  isValidStockQuantity,
  type ProductVariant,
  type StockChange,
} from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

export class IncreaseVariantStockUseCase {
  constructor(private readonly variants: ProductVariantRepo) {}

  async execute(variantId: string, input: StockChange): Promise<ProductVariant> {
    if (!isValidStockQuantity(input.quantity))
      throw new ValidationError('quantity must be positive');
    const variant = await this.variants.findById(variantId);
    if (!variant) throw new NotFoundError('ProductVariant', variantId);
    return this.variants.increaseStock(variantId, input.quantity);
  }
}
