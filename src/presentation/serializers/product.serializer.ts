import type { ProductVariant, ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.ts';
import type { ProductDTO, ProductVariantDTO } from '../schemas/product.schema.ts';

export function toProductVariantDTO(v: ProductVariant): ProductVariantDTO {
  return {
    id: v.id,
    productId: v.productId,
    sku: v.sku,
    priceCents: v.priceCents,
    currency: v.currency,
    stock: v.stock,
    expiresAt: v.expiresAt,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export function toProductDTO(p: ProductWithVariants): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    image: p.image,
    variants: p.variants.map(toProductVariantDTO),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toProductListPayload(
  result: Paginated<ProductWithVariants>,
): Paginated<ProductDTO> {
  return mapPaginated(result, toProductDTO);
}
