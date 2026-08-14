import { NotFoundError } from '../../lib/errors.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

export class SetVariantPropertyValuesUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly properties: ProductPropertyRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    variantId: string,
    values: Array<{ propertyId: string; value: string }>,
  ): Promise<void> {
    const variant = await this.variants.findById(variantId);
    if (!variant) throw new NotFoundError('ProductVariant', variantId);
    for (const { propertyId } of values) {
      const property = await this.properties.findById(propertyId);
      if (!property) throw new NotFoundError('ProductProperty', propertyId);
    }

    await this.variants.setPropertyValues(variantId, values);
    await syncProductEmbedding(
      variant.productId,
      this.products,
      this.embedding,
      this.logger,
    );
  }
}
