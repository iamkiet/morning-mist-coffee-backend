import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { CreateProductInput } from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type {
  CreateProductVariantInput,
  ProductWithVariants,
} from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import { nextSlugCandidate, slugify } from '../../domain/product/slugify.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import { attachVariantsOne } from './attach-variants.ts';
import { syncProductEmbedding } from './sync-product-embedding.ts';

const MAX_SLUG_ATTEMPTS = 50;

export interface CreateProductWithVariantInput extends CreateProductInput {
  categoryIds?: string[];
  variant: CreateProductVariantInput & {
    propertyValues?: Array<{ propertyId: string; value: string }>;
  };
}

export class CreateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly categories: ProductCategoryRepo,
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreateProductWithVariantInput): Promise<ProductWithVariants> {
    if (input.categoryIds) {
      for (const categoryId of input.categoryIds) {
        const category = await this.categories.findById(categoryId);
        if (!category) throw new NotFoundError('ProductCategory', categoryId);
      }
    }

    const slug = await this.resolveSlug(input.name);
    const product = await this.products.create({
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      slug,
    });

    const variant = await this.variants.create(product.id, input.variant);
    if (input.variant.propertyValues) {
      await this.variants.setPropertyValues(variant.id, input.variant.propertyValues);
    }
    if (input.categoryIds) {
      await this.categories.setCategoriesForProduct(product.id, input.categoryIds);
    }

    await syncProductEmbedding(product.id, this.products, this.embedding, this.logger);
    return {
      ...(await attachVariantsOne(this.variants, product)),
      categoryIds: input.categoryIds ?? [],
    };
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
