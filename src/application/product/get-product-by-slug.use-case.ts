import { NotFoundError } from '../../lib/errors.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { attachVariantsOne } from './attach-variants.ts';

export class GetProductBySlugUseCase {
  constructor(
    private readonly repo: ProductRepo,
    private readonly variants: ProductVariantRepo,
  ) {}

  async execute(slug: string): Promise<ProductWithVariants> {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw new NotFoundError('Product', slug);
    return attachVariantsOne(this.variants, product);
  }
}
