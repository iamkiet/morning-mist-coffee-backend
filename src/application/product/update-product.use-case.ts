import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.ts';
import type { UpdateProductInput } from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import { isSlug } from '../../domain/product/slugify.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import { attachVariantsOne } from './attach-variants.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

export class UpdateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(id: string, input: UpdateProductInput): Promise<ProductWithVariants> {
    if (input.slug !== undefined) {
      if (!isSlug(input.slug))
        throw new ValidationError(
          'slug must be lowercase alphanumeric words separated by single hyphens',
        );
      const taken = await this.products.findBySlug(input.slug);
      if (taken && taken.id !== id)
        throw new ConflictError(`Slug '${input.slug}' is already in use`);
    }

    const updated = await this.products.update(id, input);
    if (!updated) throw new NotFoundError('Product', id);

    if (input.name !== undefined || input.description !== undefined) {
      await syncProductEmbedding(id, this.products, this.embedding, this.logger);
    }

    return attachVariantsOne(this.variants, updated);
  }
}
