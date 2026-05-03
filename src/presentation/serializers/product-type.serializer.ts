import type { ProductType } from '../../domain/product-type/product-type.entity.js';
import type { ProductTypeDTO } from '../schemas/product-type.schema.js';

export function toProductTypeDTO(t: ProductType): ProductTypeDTO {
  return {
    id: t.id,
    name: t.name,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
