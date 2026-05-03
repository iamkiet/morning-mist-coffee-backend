import { NotFoundError } from '../../lib/errors.js';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.js';
import type {
  CreateProductInput,
  Product,
} from '../../domain/product/product.entity.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export class CreateProductUseCase {
  constructor(
    private readonly products: ProductRepo,
    private readonly productTypes: ProductTypeRepo,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const type = await this.productTypes.findById(input.productTypeId);
    if (!type) throw new NotFoundError('ProductType', input.productTypeId);
    return this.products.create(input);
  }
}
