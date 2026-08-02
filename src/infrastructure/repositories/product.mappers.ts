import { and, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductFilterCriteria } from '../../domain/product/product.repo.ts';
import { products, type ProductRow } from '../db/schema.ts';
import { containsPattern } from './ilike-pattern.ts';

export function buildProductFilters(filter: ProductFilterCriteria): SQL[] {
  const filters: SQL[] = [];
  if (filter.productTypeId)
    filters.push(eq(products.productTypeId, filter.productTypeId));
  if (filter.currency) filters.push(eq(products.currency, filter.currency));
  if (filter.priceMin !== undefined)
    filters.push(gte(products.priceCents, filter.priceMin));
  if (filter.priceMax !== undefined)
    filters.push(lte(products.priceCents, filter.priceMax));
  if (filter.q) {
    const pattern = containsPattern(filter.q);
    const match = or(
      ilike(products.name, pattern),
      ilike(products.origin, pattern),
      ilike(products.description, pattern),
      sql`array_to_string(${products.tastingNotes}, ' ') ilike ${pattern}`,
    );
    if (match) filters.push(match);
  }
  return filters;
}

export function productWhere(filter: ProductFilterCriteria): SQL | undefined {
  const filters = buildProductFilters(filter);
  return filters.length ? and(...filters) : undefined;
}

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    origin: row.origin,
    tastingNotes: row.tastingNotes,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    image: row.image,
    productTypeId: row.productTypeId,
    stockQuantity: 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
