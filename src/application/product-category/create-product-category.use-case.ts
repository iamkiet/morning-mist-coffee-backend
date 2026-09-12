import { ConflictError, NotFoundError } from '../../lib/errors.ts';
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

    if (input.parentId) {
      const parent = await this.repo.findById(input.parentId);
      if (!parent) throw new NotFoundError('ProductCategory', input.parentId);
      if (parent.parentId !== null) {
        throw new ConflictError('Category only supports one level — cannot use a child category as parent');
      }
    }

    return this.repo.create({ name, parentId: input.parentId ?? null });
  }
}
