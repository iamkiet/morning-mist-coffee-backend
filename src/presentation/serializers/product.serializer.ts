import type { Product } from '../../domain/product/product.entity.js';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.js';
import type { ProductDTO } from '../schemas/product.schema.js';

export function toProductDTO(p: Product): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    currency: p.currency,
    image: p.image,
    productTypeId: p.productTypeId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toProductListPayload(
  result: Paginated<Product>,
): Paginated<ProductDTO> {
  return mapPaginated(result, toProductDTO);
}
