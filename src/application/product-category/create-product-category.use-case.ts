import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type {
  CreateProductCategoryInput,
  ProductCategory,
} from '../../domain/product-category/product-category.entity.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';

export class CreateProductCategoryUseCase {
  constructor(private readonly repo: ProductCategoryRepo) {}

  async execute(input: CreateProductCategoryInput): Promise<ProductCategory> {
    const name = input.name.trim();
    const existing = await this.repo.findByName(name);
    if (existing) throw new ConflictError(`Category '${name}' already exists`);

    if (input.parentId) {
      const parent = await this.repo.findById(input.parentId);
      if (!parent) throw new NotFoundError('ProductCategory', input.parentId);
    }

    return this.repo.create({ name, parentId: input.parentId ?? null });
  }
}
