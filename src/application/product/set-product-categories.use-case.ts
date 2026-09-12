import { NotFoundError } from '../../lib/errors.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

export class SetProductCategoriesUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly categories: ProductCategoryRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(productId: string, categoryIds: string[]): Promise<void> {
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundError('Product', productId);
    if (categoryIds.length > 0) {
      const found = await this.categories.findByIds(categoryIds);
      const foundIds = new Set(found.map((c) => c.id));
      const missingId = categoryIds.find((id) => !foundIds.has(id));
      if (missingId) throw new NotFoundError('ProductCategory', missingId);
    }

    await this.categories.setCategoriesForProduct(productId, categoryIds);
    await syncProductEmbedding(productId, this.products, this.embedding, this.logger);
  }
}
