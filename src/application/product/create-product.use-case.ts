import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.ts';
import type {
  CreateProductInput,
  Product,
} from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { nextSlugCandidate, slugify } from '../../domain/product/slugify.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

const MAX_SLUG_ATTEMPTS = 50;

export class CreateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly productTypes: ProductTypeRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const type = await this.productTypes.findById(input.productTypeId);
    if (!type) throw new NotFoundError('ProductType', input.productTypeId);
    const slug = await this.resolveSlug(input.name);
    const product = await this.products.create({ ...input, slug });
    await syncProductEmbedding(this.products, this.embedding, this.logger, product);
    return product;
  }

  private async resolveSlug(name: string): Promise<string> {
    const base = slugify(name) || 'san-pham';
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const candidate = nextSlugCandidate(base, attempt);
      const taken = await this.products.findBySlug(candidate);
      if (!taken) return candidate;
    }
    throw new ConflictError(`Could not derive a unique slug from "${name}"`);
  }
}
