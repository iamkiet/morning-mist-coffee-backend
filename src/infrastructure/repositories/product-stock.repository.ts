import { and, eq, gte, sql } from 'drizzle-orm';
import type { ProductStock } from '../../domain/product/product-stock.entity.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
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

  async tryDecrease(productId: string, qty: number): Promise<ProductStock | null> {
    const [row] = await this.db
      .update(productStock)
      .set({
        quantity: sql`${productStock.quantity} - ${qty}`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(productStock.productId, productId), gte(productStock.quantity, qty)))
      .returning();
    return row ? rowToStock(row) : null;
  }
}
