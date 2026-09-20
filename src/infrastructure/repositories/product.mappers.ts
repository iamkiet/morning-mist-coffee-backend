import { and, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import type { Product } from '../../domain/product/product.entity.ts';
import { PROPERTY_FILTER_NAMES, WEIGHT_PROPERTY_NAME } from '../../domain/product/property-filter.ts';
import type { ProductFilterCriteria } from '../../domain/product/product.repo.ts';
import {
  productProperties,
  productVariantPropertyValues,
  productVariants,
  products,
  productsCategories,
  type ProductRow,
} from '../db/schema.ts';
import { containsPattern } from './ilike-pattern.ts';

function variantMatchExists(filter: Pick<ProductFilterCriteria, 'priceMin' | 'priceMax' | 'weight'>): SQL {
  const priceConds = [eq(productVariants.productId, products.id)];
  if (filter.priceMin !== undefined) priceConds.push(gte(productVariants.priceCents, filter.priceMin));
  if (filter.priceMax !== undefined) priceConds.push(lte(productVariants.priceCents, filter.priceMax));

  if (!filter.weight) {
    return sql`exists (select 1 from ${productVariants} where ${and(...priceConds)})`;
  }

  return sql`exists (select 1 from ${productVariants}
    inner join ${productVariantPropertyValues}
      on ${eq(productVariantPropertyValues.productVariantId, productVariants.id)}
    inner join ${productProperties}
      on ${eq(productVariantPropertyValues.productPropertyId, productProperties.id)}
    where ${and(
      ...priceConds,
      eq(productProperties.name, WEIGHT_PROPERTY_NAME),
      eq(productVariantPropertyValues.value, filter.weight),
    )})`;
}

function propertyValueExists(propertyName: string, value: string): SQL {
  return sql`exists (select 1 from ${productVariants}
    inner join ${productVariantPropertyValues}
      on ${eq(productVariantPropertyValues.productVariantId, productVariants.id)}
    inner join ${productProperties}
      on ${eq(productVariantPropertyValues.productPropertyId, productProperties.id)}
    where ${and(
      eq(productVariants.productId, products.id),
      eq(productProperties.name, propertyName),
      eq(productVariantPropertyValues.value, value),
    )})`;
}

export function buildProductFilters(filter: ProductFilterCriteria): SQL[] {
  const filters: SQL[] = [];

  if (filter.categoryId) {
    filters.push(sql`exists (select 1 from ${productsCategories}
      where ${and(
        eq(productsCategories.productId, products.id),
        eq(productsCategories.productCategoryId, filter.categoryId),
      )})`);
  }

  if (filter.priceMin !== undefined || filter.priceMax !== undefined || filter.weight) {
    filters.push(variantMatchExists(filter));
  }

  for (const [key, propertyName] of Object.entries(PROPERTY_FILTER_NAMES)) {
    const value = filter[key as keyof typeof PROPERTY_FILTER_NAMES];
    if (value) filters.push(propertyValueExists(propertyName, value));
  }

  if (filter.q) {
    const pattern = containsPattern(filter.q);
    const propertyMatch = sql`exists (select 1 from ${productVariants}
      inner join ${productVariantPropertyValues}
        on ${eq(productVariantPropertyValues.productVariantId, productVariants.id)}
      where ${and(
        eq(productVariants.productId, products.id),
        ilike(productVariantPropertyValues.value, pattern),
      )})`;
    const match = or(
      ilike(products.name, pattern),
      ilike(products.description, pattern),
      propertyMatch,
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
    description: row.description,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
