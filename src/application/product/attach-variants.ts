import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductWithVariants } from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

export async function attachVariants<T extends Product>(
  variants: ProductVariantRepo,
  items: T[],
): Promise<Array<T & ProductWithVariants>> {
  const variantMap = await variants.listByProductIds(items.map((p) => p.id));
  return items.map((p) => ({ ...p, variants: variantMap.get(p.id) ?? [] }));
}

export async function attachVariantsOne<T extends Product>(
  variants: ProductVariantRepo,
  item: T,
): Promise<T & ProductWithVariants> {
  const list = await variants.listByProductId(item.id);
  return { ...item, variants: list };
}
