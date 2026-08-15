import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';

const WEIGHT_PROPERTY_NAME = 'Trọng lượng';

export function preferVariantByWeight<T extends ProductWithVariants>(
  product: T,
  weight: string,
): T {
  const matching = product.variants.filter((v) =>
    v.propertyValues.some(
      (p) => p.propertyName === WEIGHT_PROPERTY_NAME && p.value === weight,
    ),
  );
  return matching.length > 0 ? { ...product, variants: matching } : product;
}
