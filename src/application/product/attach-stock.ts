import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';

export async function attachStock<T extends Product>(
  stock: ProductStockRepo,
  items: T[],
): Promise<T[]> {
  const stockMap = await stock.getByProductIds(items.map((p) => p.id));
  return items.map((p) => ({ ...p, stockQuantity: stockMap.get(p.id) ?? 0 }));
}

export async function attachStockOne<T extends Product>(
  stock: ProductStockRepo,
  item: T,
): Promise<T> {
  const { quantity } = await stock.getByProductId(item.id);
  return { ...item, stockQuantity: quantity };
}
