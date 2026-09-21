import { resolveUniqueName } from '../../lib/unique-name.ts';
import type {
  CreateProductCategoryInput,
  ProductCategory,
} from '../../domain/product-category/product-category.entity.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';

export class CreateProductCategoryUseCase {
  constructor(private readonly repo: ProductCategoryRepo) {}

  async execute(input: CreateProductCategoryInput): Promise<ProductCategory> {
    const name = await resolveUniqueName(
      input.name,
      (n) => this.repo.findByName(n),
      'Category',
    );

    return this.repo.create({ name });
  }
}
