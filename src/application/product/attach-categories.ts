import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';

export async function attachCategoryIds<T extends Omit<ProductWithVariants, 'categoryIds'>>(
  categoryRepo: ProductCategoryRepo,
  items: T[],
): Promise<Array<T & { categoryIds: string[] }>> {
  const categoryMap = await categoryRepo.getCategoryIdsForProducts(
    items.map((p) => p.id),
  );
  return items.map((p) => ({ ...p, categoryIds: categoryMap.get(p.id) ?? [] }));
}
