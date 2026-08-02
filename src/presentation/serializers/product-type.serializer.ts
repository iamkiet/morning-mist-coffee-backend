import type { ProductType } from '../../domain/product-type/product-type.entity.ts';
import type { ProductTypeDTO } from '../schemas/product-type.schema.ts';

export function toProductTypeDTO(t: ProductType): ProductTypeDTO {
  return {
    id: t.id,
    name: t.name,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
