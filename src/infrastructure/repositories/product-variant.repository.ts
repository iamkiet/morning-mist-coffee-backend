import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import type {
  CreateProductVariantInput,
  ProductVariant,
  UpdateProductVariantInput,
  VariantPropertyValue,
} from '../../domain/product/product-variant.entity.ts';
import type {
  BatchStockResult,
  ProductVariantRepo,
  StockDecreaseItem,
} from '../../domain/product/product-variant.repo.ts';
import type { DB } from '../db/client.ts';
import {
  productProperties,
  productVariantPropertyValues,
  productVariants,
  type ProductVariantRow,
} from '../db/schema.ts';

function rowToVariant(row: ProductVariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    priceCents: row.priceCents,
    currency: row.currency,
    stock: row.stock,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresProductVariantRepository implements ProductVariantRepo {
  constructor(private readonly db: DB) {}

  async listByProductId(productId: string): Promise<ProductVariant[]> {
    const rows = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
    return rows.map(rowToVariant);
  }

  async listByProductIds(
    productIds: string[],
  ): Promise<Map<string, ProductVariant[]>> {
    const map = new Map<string, ProductVariant[]>();
    if (productIds.length === 0) return map;
    const rows = await this.db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));
    for (const row of rows) {
      const variant = rowToVariant(row);
      const list = map.get(variant.productId);
      if (list) list.push(variant);
      else map.set(variant.productId, [variant]);
    }
    return map;
  }

  async findById(id: string): Promise<ProductVariant | null> {
    const [row] = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id))
      .limit(1);
    return row ? rowToVariant(row) : null;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const [row] = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, sku))
      .limit(1);
    return row ? rowToVariant(row) : null;
  }

  async create(
    productId: string,
    input: CreateProductVariantInput,
  ): Promise<ProductVariant> {
    const [row] = await this.db
      .insert(productVariants)
      .values({
        productId,
        sku: input.sku,
        priceCents: input.priceCents,
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        expiresAt: input.expiresAt ?? null,
      })
      .returning();
    if (!row) throw new Error('Failed to create product variant');
    return rowToVariant(row);
  }

  async update(
    id: string,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariant | null> {
    const patch: Partial<{
      sku: string;
      priceCents: number;
      currency: ProductVariantRow['currency'];
      stock: number;
      expiresAt: string | null;
    }> = {};
    if (input.sku !== undefined) patch.sku = input.sku;
    if (input.priceCents !== undefined) patch.priceCents = input.priceCents;
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.stock !== undefined) patch.stock = input.stock;
    if (input.expiresAt !== undefined) patch.expiresAt = input.expiresAt;

    if (Object.keys(patch).length === 0) return this.findById(id);

    const [row] = await this.db
      .update(productVariants)
      .set(patch)
      .where(eq(productVariants.id, id))
      .returning();
    return row ? rowToVariant(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(productVariants)
      .where(eq(productVariants.id, id))
      .returning({ id: productVariants.id });
    return rows.length > 0;
  }

  async increaseStock(variantId: string, qty: number): Promise<ProductVariant> {
    const [row] = await this.db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${qty}`, updatedAt: sql`now()` })
      .where(eq(productVariants.id, variantId))
      .returning();
    if (!row) throw new Error('Failed to increase variant stock');
    return rowToVariant(row);
  }

  async setStock(variantId: string, qty: number): Promise<ProductVariant> {
    const [row] = await this.db
      .update(productVariants)
      .set({ stock: qty, updatedAt: sql`now()` })
      .where(eq(productVariants.id, variantId))
      .returning();
    if (!row) throw new Error('Failed to set variant stock');
    return rowToVariant(row);
  }

  async tryDecreaseStock(
    variantId: string,
    qty: number,
  ): Promise<ProductVariant | null> {
    const [row] = await this.db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} - ${qty}`, updatedAt: sql`now()` })
      .where(
        and(eq(productVariants.id, variantId), gte(productVariants.stock, qty)),
      )
      .returning();
    return row ? rowToVariant(row) : null;
  }

  async tryDecreaseStockBatch(
    items: StockDecreaseItem[],
  ): Promise<BatchStockResult> {
    if (items.length === 0) return { ok: true };
    let insufficientVariantId: string | undefined;
    try {
      await this.db.transaction(async (tx) => {
        for (const { variantId, qty } of items) {
          const [row] = await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${qty}`, updatedAt: sql`now()` })
            .where(
              and(eq(productVariants.id, variantId), gte(productVariants.stock, qty)),
            )
            .returning({ id: productVariants.id });
          if (!row) {
            insufficientVariantId = variantId;
            tx.rollback();
          }
        }
      });
    } catch (err) {
      if (insufficientVariantId !== undefined) {
        return { ok: false, variantId: insufficientVariantId };
      }
      throw err;
    }
    return { ok: true };
  }

  async getPropertyValues(variantId: string): Promise<VariantPropertyValue[]> {
    const rows = await this.db
      .select({
        propertyId: productProperties.id,
        propertyName: productProperties.name,
        value: productVariantPropertyValues.value,
      })
      .from(productVariantPropertyValues)
      .innerJoin(
        productProperties,
        eq(productVariantPropertyValues.productPropertyId, productProperties.id),
      )
      .where(eq(productVariantPropertyValues.productVariantId, variantId));
    return rows;
  }

  async setPropertyValues(
    variantId: string,
    values: Array<{ propertyId: string; value: string }>,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(productVariantPropertyValues)
        .where(eq(productVariantPropertyValues.productVariantId, variantId));
      if (values.length === 0) return;
      await tx.insert(productVariantPropertyValues).values(
        values.map((v) => ({
          productVariantId: variantId,
          productPropertyId: v.propertyId,
          value: v.value,
        })),
      );
    });
  }
}
