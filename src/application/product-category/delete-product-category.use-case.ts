import { NotFoundError } from '../../lib/errors.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { syncProductEmbedding } from '../product/sync-product-embedding.ts';

export class DeleteProductCategoryUseCase {
  constructor(
    private readonly repo: ProductCategoryRepo,
    private readonly products: ProductRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('ProductCategory', id);

    const productIds = await this.repo.getProductIdsForCategory(id);
    await this.repo.delete(id);
    await Promise.all(
      productIds.map((productId) =>
        syncProductEmbedding(productId, this.products, this.embedding, this.logger),
      ),
    );
  }
}
