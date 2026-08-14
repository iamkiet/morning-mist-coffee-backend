import type { ProductCategory } from '../../domain/product-category/product-category.entity.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';

export class ListProductCategoriesUseCase {
  constructor(private readonly repo: ProductCategoryRepo) {}

  execute(): Promise<ProductCategory[]> {
    return this.repo.list();
  }
}
