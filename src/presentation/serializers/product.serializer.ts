import type { Product } from '../../domain/product/product.entity.ts';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.ts';
import type { ProductDTO } from '../schemas/product.schema.ts';

export function toProductDTO(p: Product): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    origin: p.origin,
    tastingNotes: p.tastingNotes,
    description: p.description,
    priceCents: p.priceCents,
    currency: p.currency,
    image: p.image,
    productTypeId: p.productTypeId,
    stockQuantity: p.stockQuantity,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toProductListPayload(
  result: Paginated<Product>,
): Paginated<ProductDTO> {
  return mapPaginated(result, toProductDTO);
}
