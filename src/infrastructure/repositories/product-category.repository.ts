import { asc, eq, inArray, sql } from 'drizzle-orm';
import { ExternalServiceError } from '../../lib/errors.ts';
import type {
  CreateProductCategoryInput,
  ProductCategory,
  UpdateProductCategoryInput,
} from '../../domain/product-category/product-category.entity.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { DB } from '../db/client.ts';
import {
  productCategories,
  productsCategories,
  type ProductCategoryRow,
} from '../db/schema.ts';

function rowToCategory(row: ProductCategoryRow): ProductCategory {
  return { id: row.id, name: row.name, createdAt: row.createdAt };
}

export class PostgresProductCategoryRepository implements ProductCategoryRepo {
  constructor(private readonly db: DB) {}

  async list(): Promise<ProductCategory[]> {
    const rows = await this.db
      .select()
      .from(productCategories)
      .orderBy(asc(productCategories.name));
    return rows.map(rowToCategory);
  }

  async findById(id: string): Promise<ProductCategory | null> {
    const [row] = await this.db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, id))
      .limit(1);
    return row ? rowToCategory(row) : null;
  }

  async findByIds(ids: string[]): Promise<ProductCategory[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(productCategories)
      .where(inArray(productCategories.id, ids));
    return rows.map(rowToCategory);
  }

  async findByName(name: string): Promise<ProductCategory | null> {
    const [row] = await this.db
      .select()
      .from(productCategories)
      .where(sql`lower(${productCategories.name}) = lower(${name})`)
      .limit(1);
    return row ? rowToCategory(row) : null;
  }

  async create(input: CreateProductCategoryInput): Promise<ProductCategory> {
    const [row] = await this.db
      .insert(productCategories)
      .values({ name: input.name })
      .returning();
    if (!row) throw new ExternalServiceError('Database', 'Failed to create product category');
    return rowToCategory(row);
  }

  async update(
    id: string,
    input: UpdateProductCategoryInput,
  ): Promise<ProductCategory | null> {
    const values: Partial<typeof productCategories.$inferInsert> = {};
    if (input.name !== undefined) values.name = input.name;

    const [row] = await this.db
      .update(productCategories)
      .set(values)
      .where(eq(productCategories.id, id))
      .returning();
    return row ? rowToCategory(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(productCategories)
      .where(eq(productCategories.id, id))
      .returning({ id: productCategories.id });
    return result.length > 0;
  }

  async getProductIdsForCategory(categoryId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: productsCategories.productId })
      .from(productsCategories)
      .where(eq(productsCategories.productCategoryId, categoryId));
    return rows.map((r) => r.id);
  }

  async getCategoryIdsForProduct(productId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: productsCategories.productCategoryId })
      .from(productsCategories)
      .where(eq(productsCategories.productId, productId));
    return rows.map((r) => r.id);
  }

  async getCategoryIdsForProducts(
    productIds: string[],
  ): Promise<Map<string, string[]>> {
    if (productIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        productId: productsCategories.productId,
        categoryId: productsCategories.productCategoryId,
      })
      .from(productsCategories)
      .where(inArray(productsCategories.productId, productIds));
    const map = new Map<string, string[]>();
    for (const row of rows) {
      const list = map.get(row.productId) ?? [];
      list.push(row.categoryId);
      map.set(row.productId, list);
    }
    return map;
  }

  async setCategoriesForProduct(
    productId: string,
    categoryIds: string[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(productsCategories)
        .where(eq(productsCategories.productId, productId));
      if (categoryIds.length === 0) return;
      await tx.insert(productsCategories).values(
        categoryIds.map((categoryId) => ({
          productId,
          productCategoryId: categoryId,
        })),
      );
    });
  }
}
