import { NotFoundError } from '../../lib/errors.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { attachVariantsOne } from './attach-variants.ts';

export class GetProductByIdUseCase {
  constructor(
    private readonly repo: ProductRepo,
    private readonly variants: ProductVariantRepo,
  ) {}

  async execute(id: string): Promise<ProductWithVariants> {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundError('Product', id);
    return attachVariantsOne(this.variants, product);
  }
}
