import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.js';
import type {
  Product,
  UpdateProductInput,
} from '../../domain/product/product.entity.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';
import { isSlug } from '../../domain/product/slugify.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.js';
import { syncProductEmbedding, type EmbeddingSyncLogger } from './sync-product-embedding.js';

export class UpdateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly productTypes: ProductTypeRepo,
    private readonly stock: ProductStockRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: EmbeddingSyncLogger,
  ) {}

  async execute(id: string, input: UpdateProductInput): Promise<Product> {
    if (input.productTypeId) {
      const type = await this.productTypes.findById(input.productTypeId);
      if (!type) throw new NotFoundError('ProductType', input.productTypeId);
    }
    if (input.slug !== undefined) {
      if (!isSlug(input.slug))
        throw new ValidationError(
          'slug must be lowercase alphanumeric words separated by single hyphens',
        );
      const taken = await this.products.findBySlug(input.slug);
      if (taken && taken.id !== id)
        throw new ConflictError(`Slug '${input.slug}' is already in use`);
    }
    const { stockQuantity, ...productFields } = input;
    const updated = await this.products.update(id, productFields);
    if (!updated) throw new NotFoundError('Product', id);

    if (
      input.name !== undefined ||
      input.origin !== undefined ||
      input.tastingNotes !== undefined ||
      input.description !== undefined
    ) {
      await syncProductEmbedding(this.products, this.embedding, this.logger, updated);
    }

    if (stockQuantity !== undefined) {
      const s = await this.stock.set(id, stockQuantity);
      return { ...updated, stockQuantity: s.quantity };
    }
    return updated;
  }
}
