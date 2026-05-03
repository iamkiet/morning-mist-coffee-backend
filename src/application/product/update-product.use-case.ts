import { NotFoundError } from '../../lib/errors.js';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.js';
import type {
  Product,
  UpdateProductInput,
} from '../../domain/product/product.entity.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export class UpdateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly productTypes: ProductTypeRepo,
  ) {}

  async execute(id: string, input: UpdateProductInput): Promise<Product> {
    if (input.productTypeId) {
      const type = await this.productTypes.findById(input.productTypeId);
      if (!type) throw new NotFoundError('ProductType', input.productTypeId);
    }
    const updated = await this.products.update(id, input);
    if (!updated) throw new NotFoundError('Product', id);
    return updated;
  }
}
