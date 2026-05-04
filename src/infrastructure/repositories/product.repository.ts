import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';
import type {
  CreateProductInput,
  ListProductsFilter,
  Product,
  ProductSortField,
  UpdateProductInput,
} from '../../domain/product/product.entity.js';
import type {
  ProductFilterCriteria,
  ProductRepo,
} from '../../domain/product/product.repo.js';
import type { Currency } from '../../domain/shared/currency.js';
import type { DB } from '../db/client.js';
import { products, type ProductRow } from '../db/schema.js';

const SORT_COLUMNS = {
  createdAt: products.createdAt,
  name: products.name,
  priceCents: products.priceCents,
} as const satisfies Record<ProductSortField, unknown>;

function buildFilters(filter: ProductFilterCriteria): SQL[] {
  const filters: SQL[] = [];
  if (filter.productTypeId)
    filters.push(eq(products.productTypeId, filter.productTypeId));
  if (filter.currency) filters.push(eq(products.currency, filter.currency));
  if (filter.priceMin !== undefined)
    filters.push(gte(products.priceCents, filter.priceMin));
  if (filter.priceMax !== undefined)
    filters.push(lte(products.priceCents, filter.priceMax));
  if (filter.q) filters.push(ilike(products.name, `%${filter.q}%`));
  return filters;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
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

export class PostgresProductRepository implements ProductRepo {
  constructor(private readonly db: DB) {}

  async list(filter: ListProductsFilter): Promise<Product[]> {
    const filters = buildFilters(filter);
    const orderFn = filter.sortDir === 'asc' ? asc : desc;
    const sortColumn = SORT_COLUMNS[filter.sortBy];

    const rows = await this.db
      .select()
      .from(products)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(orderFn(sortColumn), desc(products.id))
      .limit(filter.limit)
      .offset(filter.offset);
    return rows.map(rowToProduct);
  }

  async count(filter: ProductFilterCriteria): Promise<number> {
    const filters = buildFilters(filter);

    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(filters.length ? and(...filters) : undefined);
    return row?.count ?? 0;
  }

  async findById(id: string): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return row ? rowToProduct(row) : null;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const [row] = await this.db
      .insert(products)
      .values({
        name: input.name,
        description: input.description ?? null,
        priceCents: input.priceCents,
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        image: input.image ?? null,
        productTypeId: input.productTypeId,
      })
      .returning();
    if (!row) throw new Error('Failed to create product');
    return rowToProduct(row);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const patch: Partial<{
      name: string;
      description: string | null;
      priceCents: number;
      currency: Currency;
      image: string | null;
      productTypeId: string;
    }> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.priceCents !== undefined) patch.priceCents = input.priceCents;
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.image !== undefined) patch.image = input.image;
    if (input.productTypeId !== undefined)
      patch.productTypeId = input.productTypeId;

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const [row] = await this.db
      .update(products)
      .set(patch)
      .where(eq(products.id, id))
      .returning();
    return row ? rowToProduct(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(products)
      .where(eq(products.id, id))
      .returning({
        id: products.id,
      });
    return rows.length > 0;
  }
}
