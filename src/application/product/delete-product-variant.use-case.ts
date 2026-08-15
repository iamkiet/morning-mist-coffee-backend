import { NotFoundError } from '../../lib/errors.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

export class DeleteProductVariantUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(variantId: string): Promise<void> {
    const variant = await this.variants.findById(variantId);
    if (!variant) throw new NotFoundError('ProductVariant', variantId);

    const ok = await this.variants.delete(variantId);
    if (!ok) throw new NotFoundError('ProductVariant', variantId);

    await syncProductEmbedding(variant.productId, this.products, this.embedding, this.logger);
  }
}
