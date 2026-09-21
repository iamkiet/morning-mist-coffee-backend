import { NotFoundError } from '../../lib/errors.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import { attachVariantsOne } from './attach-variants.ts';
import { attachCategoriesOne } from './attach-categories.ts';

export class GetProductBySlugUseCase {
  constructor(
    private readonly repo: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly categories: ProductCategoryRepo,
  ) {}

  async execute(slug: string): Promise<ProductWithVariants> {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw new NotFoundError('Product', slug);
    return attachCategoriesOne(this.categories, await attachVariantsOne(this.variants, product));
  }
}
