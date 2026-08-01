import { NotFoundError } from '../../lib/errors.js';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.js';
import type {
  CreateProductInput,
  Product,
} from '../../domain/product/product.entity.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.js';
import { syncProductEmbedding, type EmbeddingSyncLogger } from './sync-product-embedding.js';

export class CreateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly productTypes: ProductTypeRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: EmbeddingSyncLogger,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const type = await this.productTypes.findById(input.productTypeId);
    if (!type) throw new NotFoundError('ProductType', input.productTypeId);
    const product = await this.products.create(input);
    await syncProductEmbedding(this.products, this.embedding, this.logger, product);
    return product;
  }
}
