import { NotFoundError } from '../../lib/errors.ts';
import type { ProductVariant, UpdateProductVariantInput } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

export class UpdateProductVariantUseCase {
  constructor(private readonly variants: ProductVariantRepo) {}

  async execute(
    variantId: string,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariant> {
    const updated = await this.variants.update(variantId, input);
    if (!updated) throw new NotFoundError('ProductVariant', variantId);
    return updated;
  }
}
