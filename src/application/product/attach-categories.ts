import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';

type WithoutCategories<T> = Omit<T, 'categoryIds' | 'categoryNames'>;
type WithCategories<T> = T & { categoryIds: string[]; categoryNames: string[] };

function namesFor(categoryIds: string[], nameById: Map<string, string>): string[] {
  return categoryIds
    .map((id) => nameById.get(id))
    .filter((name): name is string => name !== undefined);
}

export async function attachCategories<T extends WithoutCategories<ProductWithVariants>>(
  categoryRepo: ProductCategoryRepo,
  items: T[],
): Promise<Array<WithCategories<T>>> {
  const categoryIdMap = await categoryRepo.getCategoryIdsForProducts(items.map((p) => p.id));
  const allCategoryIds = [...new Set([...categoryIdMap.values()].flat())];
  const categories = await categoryRepo.findByIds(allCategoryIds);
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return items.map((p) => {
    const categoryIds = categoryIdMap.get(p.id) ?? [];
    return { ...p, categoryIds, categoryNames: namesFor(categoryIds, nameById) };
  });
}

export async function attachCategoriesOne<T extends WithoutCategories<ProductWithVariants>>(
  categoryRepo: ProductCategoryRepo,
  item: T,
): Promise<WithCategories<T>> {
  const categoryIds = await categoryRepo.getCategoryIdsForProduct(item.id);
  const categories = await categoryRepo.findByIds(categoryIds);
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return { ...item, categoryIds, categoryNames: namesFor(categoryIds, nameById) };
}
