import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.ts';
import type { ProductType } from '../../domain/product-type/product-type.entity.ts';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.ts';
import type {
  Product,
  UpdateProductInput,
} from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { isSlug } from '../../domain/product/slugify.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

export class UpdateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly productTypes: ProductTypeRepo,
    private readonly stock: ProductStockRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(id: string, input: UpdateProductInput): Promise<Product> {
    let type: ProductType | null = null;
    if (input.productTypeId) {
      type = await this.productTypes.findById(input.productTypeId);
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
      input.description !== undefined ||
      input.productTypeId !== undefined
    ) {
      type ??= await this.productTypes.findById(updated.productTypeId);
      if (!type) throw new NotFoundError('ProductType', updated.productTypeId);
      await syncProductEmbedding(this.products, this.embedding, this.logger, updated, type);
    }

    if (stockQuantity !== undefined) {
      const s = await this.stock.set(id, stockQuantity);
      return { ...updated, stockQuantity: s.quantity };
    }
    return updated;
  }
}
