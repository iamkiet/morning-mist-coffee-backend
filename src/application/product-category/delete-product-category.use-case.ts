import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';

export class DeleteProductCategoryUseCase {
  constructor(private readonly repo: ProductCategoryRepo) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('ProductCategory', id);

    const hasChildren = await this.repo.hasChildren(id);
    if (hasChildren) {
      throw new ConflictError('Cannot delete a category that has subcategories');
    }

    await this.repo.delete(id);
  }
}
