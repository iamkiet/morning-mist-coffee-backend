import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.ts';
import type {
  ProductVariant,
  StockChange,
} from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

export class DecreaseVariantStockUseCase {
  constructor(private readonly variants: ProductVariantRepo) {}

  async execute(variantId: string, input: StockChange): Promise<ProductVariant> {
    if (input.quantity <= 0)
      throw new ValidationError('quantity must be positive');
    const variant = await this.variants.findById(variantId);
    if (!variant) throw new NotFoundError('ProductVariant', variantId);

    const updated = await this.variants.tryDecreaseStock(variantId, input.quantity);
    if (!updated) throw new ConflictError('Insufficient stock');
    return updated;
  }
}
