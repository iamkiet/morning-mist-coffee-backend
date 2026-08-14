import { NotFoundError } from '../../lib/errors.ts';
import type { ProductVariant } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

export class GetVariantStockUseCase {
  constructor(private readonly variants: ProductVariantRepo) {}

  async execute(variantId: string): Promise<ProductVariant> {
    const variant = await this.variants.findById(variantId);
    if (!variant) throw new NotFoundError('ProductVariant', variantId);
    return variant;
  }
}
