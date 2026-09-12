import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type {
  ProductCategory,
  UpdateProductCategoryInput,
} from '../../domain/product-category/product-category.entity.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';

export class UpdateProductCategoryUseCase {
  constructor(private readonly repo: ProductCategoryRepo) {}

  async execute(
    id: string,
    input: UpdateProductCategoryInput,
  ): Promise<ProductCategory> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('ProductCategory', id);

    if (input.name !== undefined) {
      const name = input.name.trim();
      const nameTaken = await this.repo.findByName(name);
      if (nameTaken && nameTaken.id !== id) {
        throw new ConflictError(`Category '${name}' already exists`);
      }
      input = { ...input, name };
    }

    if (input.parentId) {
      if (input.parentId === id) {
        throw new ConflictError('A category cannot be its own parent');
      }
      const parent = await this.repo.findById(input.parentId);
      if (!parent) throw new NotFoundError('ProductCategory', input.parentId);
    }

    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('ProductCategory', id);
    return updated;
  }
}
