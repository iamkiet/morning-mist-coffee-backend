import {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type {
  CreateProductRecord,
  ListProductsFilter,
  Product,
  ProductSortField,
  UpdateProductInput,
} from '../../domain/product/product.entity.js';
import type {
  ProductFilterCriteria,
  ProductRepo,
  SimilarProduct,
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
  if (filter.q) {
    const pattern = `%${filter.q}%`;
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

function rowToProduct(row: ProductRow): Product {
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

  async findBySlug(slug: string): Promise<Product | null> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return row ? rowToProduct(row) : null;
  }

  async create(input: CreateProductRecord): Promise<Product> {
    const [row] = await this.db
      .insert(products)
      .values({
        slug: input.slug,
        name: input.name,
        origin: input.origin ?? null,
        ...(input.tastingNotes !== undefined
          ? { tastingNotes: input.tastingNotes }
          : {}),
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
      slug: string;
      name: string;
      origin: string | null;
      tastingNotes: string[];
      description: string | null;
      priceCents: number;
      currency: Currency;
      image: string | null;
      productTypeId: string;
    }> = {};
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.name !== undefined) patch.name = input.name;
    if (input.origin !== undefined) patch.origin = input.origin;
    if (input.tastingNotes !== undefined) patch.tastingNotes = input.tastingNotes;
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

  async updateEmbedding(id: string, embedding: number[] | null): Promise<void> {
    await this.db.update(products).set({ embedding }).where(eq(products.id, id));
  }

  async findSimilarByVector(embedding: number[], limit: number): Promise<SimilarProduct[]> {
    const similarity = sql<number>`1 - (${cosineDistance(products.embedding, embedding)})`;
    const rows = await this.db
      .select({ product: products, score: similarity })
      .from(products)
      .where(isNotNull(products.embedding))
      .orderBy(desc(similarity))
      .limit(limit);
    return rows.map((r) => ({ product: rowToProduct(r.product), score: r.score }));
  }
}
