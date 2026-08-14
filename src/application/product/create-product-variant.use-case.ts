import { NotFoundError } from '../../lib/errors.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { CreateProductVariantInput, ProductVariant } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

export interface CreateProductVariantWithPropertiesInput extends CreateProductVariantInput {
  propertyValues?: Array<{ propertyId: string; value: string }>;
}

export class CreateProductVariantUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly properties: ProductPropertyRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    productId: string,
    input: CreateProductVariantWithPropertiesInput,
  ): Promise<ProductVariant> {
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundError('Product', productId);

    const { propertyValues, ...variantInput } = input;
    if (propertyValues) {
      for (const { propertyId } of propertyValues) {
        const property = await this.properties.findById(propertyId);
        if (!property) throw new NotFoundError('ProductProperty', propertyId);
      }
    }

    const variant = await this.variants.create(productId, variantInput);
    if (propertyValues) {
      await this.variants.setPropertyValues(variant.id, propertyValues);
      await syncProductEmbedding(productId, this.products, this.embedding, this.logger);
    }

    return variant;
  }
}
