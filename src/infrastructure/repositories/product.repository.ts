import { and, asc, cosineDistance, desc, eq, isNotNull, sql } from 'drizzle-orm';
import type {
  CreateProductRecord,
  ListProductsFilter,
  Product,
  ProductEmbeddingSource,
  ProductSearchFilter,
  ProductSortField,
  UpdateProductInput,
} from '../../domain/product/product.entity.ts';
import type {
  ProductFilterCriteria,
  ProductRepo,
  SimilarProduct,
} from '../../domain/product/product.repo.ts';
import type { DB } from '../db/client.ts';
import {
  productCategories,
  productProperties,
  productVariantPropertyValues,
  productVariants,
  products,
  productsCategories,
} from '../db/schema.ts';
import { buildProductFilters, productWhere, rowToProduct } from './product.mappers.ts';

const SORT_COLUMNS = {
  createdAt: products.createdAt,
  name: products.name,
} as const satisfies Record<ProductSortField, unknown>;

export class PostgresProductRepository implements ProductRepo {
  constructor(private readonly db: DB) {}

  async list(filter: ListProductsFilter): Promise<Product[]> {
    const orderFn = filter.sortDir === 'asc' ? asc : desc;
    const sortColumn = SORT_COLUMNS[filter.sortBy];

    const rows = await this.db
      .select()
      .from(products)
      .where(productWhere(filter))
      .orderBy(orderFn(sortColumn), desc(products.id))
      .limit(filter.limit)
      .offset(filter.offset);
    return rows.map(rowToProduct);
  }

  async count(filter: ProductFilterCriteria): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(productWhere(filter));
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
        description: input.description ?? null,
        image: input.image ?? null,
      })
      .returning();
    if (!row) throw new Error('Failed to create product');
    return rowToProduct(row);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const patch: Partial<{
      slug: string;
      name: string;
      description: string | null;
      image: string | null;
    }> = {};
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.image !== undefined) patch.image = input.image;

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
      .returning({ id: products.id });
    return rows.length > 0;
  }

  async updateEmbedding(id: string, embedding: number[] | null): Promise<void> {
    await this.db.update(products).set({ embedding }).where(eq(products.id, id));
  }

  async getEmbeddingSource(id: string): Promise<ProductEmbeddingSource | null> {
    const [product] = await this.db
      .select({ name: products.name, description: products.description })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!product) return null;

    const [linkedCategoryIds, allCategories, propertyRows] = await Promise.all([
      this.db
        .select({ id: productsCategories.productCategoryId })
        .from(productsCategories)
        .where(eq(productsCategories.productId, id)),
      this.db
        .select({
          id: productCategories.id,
          name: productCategories.name,
          parentId: productCategories.parentId,
        })
        .from(productCategories),
      this.db
        .select({
          propertyName: productProperties.name,
          value: productVariantPropertyValues.value,
        })
        .from(productVariants)
        .innerJoin(
          productVariantPropertyValues,
          eq(productVariantPropertyValues.productVariantId, productVariants.id),
        )
        .innerJoin(
          productProperties,
          eq(productVariantPropertyValues.productPropertyId, productProperties.id),
        )
        .where(eq(productVariants.productId, id)),
    ]);

    const categoryById = new Map(allCategories.map((c) => [c.id, c]));
    const categoryNames = new Set<string>();
    for (const { id: categoryId } of linkedCategoryIds) {
      let current = categoryById.get(categoryId);
      while (current) {
        categoryNames.add(current.name);
        current = current.parentId ? categoryById.get(current.parentId) : undefined;
      }
    }

    const seen = new Set<string>();
    const propertyValues = propertyRows.filter((r) => {
      const key = `${r.propertyName}::${r.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      name: product.name,
      description: product.description,
      categoryNames: [...categoryNames],
      propertyValues,
    };
  }

  async findSimilarByVector(
    embedding: number[],
    limit: number,
    filter?: ProductSearchFilter,
  ): Promise<SimilarProduct[]> {
    const similarity = sql<number>`1 - (${cosineDistance(products.embedding, embedding)})`;
    const filters = [isNotNull(products.embedding), ...buildProductFilters(filter ?? {})];

    const rows = await this.db
      .select({ product: products, score: similarity })
      .from(products)
      .where(and(...filters))
      .orderBy(desc(similarity))
      .limit(limit);
    return rows.map((r) => ({ product: rowToProduct(r.product), score: r.score }));
  }
}
