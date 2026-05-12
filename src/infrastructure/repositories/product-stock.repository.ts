import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import type { ProductStock } from '../../domain/product/product-stock.entity.js';
import type {
  ProductStockRepo,
  StockDecreaseItem,
} from '../../domain/product/product-stock.repo.js';
import type { DB } from '../db/client.js';
import { productStock, type ProductStockRow } from '../db/schema.js';

function rowToStock(row: ProductStockRow): ProductStock {
  return { productId: row.productId, quantity: row.quantity };
}

export class PostgresProductStockRepository implements ProductStockRepo {
  constructor(private readonly db: DB) {}

  async getByProductId(productId: string): Promise<ProductStock> {
    const [row] = await this.db
      .select()
      .from(productStock)
      .where(eq(productStock.productId, productId))
      .limit(1);
    return row ? rowToStock(row) : { productId, quantity: 0 };
  }

  async increase(productId: string, qty: number): Promise<ProductStock> {
    const [row] = await this.db
      .insert(productStock)
      .values({ productId, quantity: qty })
      .onConflictDoUpdate({
        target: productStock.productId,
        set: {
          quantity: sql`${productStock.quantity} + ${qty}`,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    if (!row) throw new Error('Failed to increase stock');
    return rowToStock(row);
  }

  async getByProductIds(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const rows = await this.db
      .select()
      .from(productStock)
      .where(inArray(productStock.productId, ids));
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.productId, row.quantity);
    }
    return map;
  }

  async set(productId: string, qty: number): Promise<ProductStock> {
    const [row] = await this.db
      .insert(productStock)
      .values({ productId, quantity: qty })
      .onConflictDoUpdate({
        target: productStock.productId,
        set: { quantity: qty, updatedAt: sql`now()` },
      })
      .returning();
    if (!row) throw new Error('Failed to set stock');
    return rowToStock(row);
  }

  async tryDecrease(
    productId: string,
    qty: number,
  ): Promise<ProductStock | null> {
    const [row] = await this.db
      .update(productStock)
      .set({
        quantity: sql`${productStock.quantity} - ${qty}`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(productStock.productId, productId),
          gte(productStock.quantity, qty),
        ),
      )
      .returning();
    return row ? rowToStock(row) : null;
  }

  async tryDecreaseBatch(items: StockDecreaseItem[]): Promise<boolean> {
    if (items.length === 0) return true;
    try {
      await this.db.transaction(async (tx) => {
        for (const { productId, qty } of items) {
          const [row] = await tx
            .update(productStock)
            .set({
              quantity: sql`${productStock.quantity} - ${qty}`,
              updatedAt: sql`now()`,
            })
            .where(
              and(
                eq(productStock.productId, productId),
                gte(productStock.quantity, qty),
              ),
            )
            .returning({ id: productStock.productId });
          if (!row) throw new Error('INSUFFICIENT_STOCK');
        }
      });
      return true;
    } catch (err) {
      if (err instanceof Error && err.message === 'INSUFFICIENT_STOCK')
        return false;
      throw err;
    }
  }
}
