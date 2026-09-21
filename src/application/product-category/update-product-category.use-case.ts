import { NotFoundError } from '../../lib/errors.ts';
import { resolveUniqueName } from '../../lib/unique-name.ts';
import type {
  ProductCategory,
  UpdateProductCategoryInput,
} from '../../domain/product-category/product-category.entity.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { syncProductEmbedding } from '../product/sync-product-embedding.ts';

export class UpdateProductCategoryUseCase {
  constructor(
    private readonly repo: ProductCategoryRepo,
    private readonly products: ProductRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    id: string,
    input: UpdateProductCategoryInput,
  ): Promise<ProductCategory> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('ProductCategory', id);

    if (input.name !== undefined) {
      const name = await resolveUniqueName(
        input.name,
        (n) => this.repo.findByName(n),
        'Category',
        id,
      );
      input = { ...input, name };
    }

    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('ProductCategory', id);

    if (input.name !== undefined) {
      const productIds = await this.repo.getProductIdsForCategory(id);
      await Promise.all(
        productIds.map((productId) =>
          syncProductEmbedding(productId, this.products, this.embedding, this.logger),
        ),
      );
    }

    return updated;
  }
}
