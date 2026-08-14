import type { ProductProperty } from '../../domain/product-property/product-property.entity.ts';
import type { ProductPropertyDTO } from '../schemas/product-property.schema.ts';

export function toProductPropertyDTO(p: ProductProperty): ProductPropertyDTO {
  return {
    id: p.id,
    name: p.name,
    dataType: p.dataType,
    createdAt: p.createdAt.toISOString(),
  };
}
