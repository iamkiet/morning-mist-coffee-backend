import type { Product } from '../../domain/product/product.entity.ts';
import type {
  ProductVariant,
  ProductWithVariants,
} from '../../domain/product/product-variant.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';

async function withProperties(variantRepo: ProductVariantRepo, variants: ProductVariant[]) {
  const propertyMap = await variantRepo.getPropertyValuesByVariantIds(
    variants.map((v) => v.id),
  );
  return variants.map((v) => ({ ...v, propertyValues: propertyMap.get(v.id) ?? [] }));
}

export async function attachVariants<T extends Product>(
  variantRepo: ProductVariantRepo,
  items: T[],
): Promise<Array<T & ProductWithVariants>> {
  const variantMap = await variantRepo.listByProductIds(items.map((p) => p.id));
  const allVariants = [...variantMap.values()].flat();
  const propertyMap = await variantRepo.getPropertyValuesByVariantIds(
    allVariants.map((v) => v.id),
  );
  return items.map((p) => ({
    ...p,
    variants: (variantMap.get(p.id) ?? []).map((v) => ({
      ...v,
      propertyValues: propertyMap.get(v.id) ?? [],
    })),
  }));
}

export async function attachVariantsOne<T extends Product>(
  variantRepo: ProductVariantRepo,
  item: T,
): Promise<T & ProductWithVariants> {
  const list = await variantRepo.listByProductId(item.id);
  const variants = await withProperties(variantRepo, list);
  return { ...item, variants };
}
