import { NotFoundError } from '../../lib/errors.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { CreateProductVariantInput, ProductVariant } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

export class CreateProductVariantUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
  ) {}

  async execute(
    productId: string,
    input: CreateProductVariantInput,
  ): Promise<ProductVariant> {
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundError('Product', productId);
    return this.variants.create(productId, input);
  }
}
