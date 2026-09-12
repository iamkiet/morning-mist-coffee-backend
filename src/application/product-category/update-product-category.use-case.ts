import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import { resolveUniqueName } from '../../lib/unique-name.ts';
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
      const name = await resolveUniqueName(
        input.name,
        (n) => this.repo.findByName(n),
        'Category',
        id,
      );
      input = { ...input, name };
    }

    if (input.parentId) {
      if (input.parentId === id) {
        throw new ConflictError('A category cannot be its own parent');
      }
      const parent = await this.repo.findById(input.parentId);
      if (!parent) throw new NotFoundError('ProductCategory', input.parentId);
      if (parent.parentId !== null) {
        throw new ConflictError('Category only supports one level — cannot use a child category as parent');
      }
      const hasChildren = await this.repo.hasChildren(id);
      if (hasChildren) {
        throw new ConflictError('Category has children — cannot assign it a parent');
      }
    }

    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('ProductCategory', id);
    return updated;
  }
}
