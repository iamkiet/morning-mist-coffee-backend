import { NotFoundError } from '../../lib/errors.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

export class DeleteProductVariantUseCase {
  constructor(private readonly variants: ProductVariantRepo) {}

  async execute(variantId: string): Promise<void> {
    const ok = await this.variants.delete(variantId);
    if (!ok) throw new NotFoundError('ProductVariant', variantId);
  }
}
