import type { ProductCategory } from '../../domain/product-category/product-category.entity.ts';
import type { ProductCategoryDTO } from '../schemas/product-category.schema.ts';

export function toProductCategoryDTO(c: ProductCategory): ProductCategoryDTO {
  return {
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    createdAt: c.createdAt.toISOString(),
  };
}
