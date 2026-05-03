import type { ProductStock } from './product-stock.entity.js';

export interface ProductStockRepo {
  getByProductId(productId: string): Promise<ProductStock>;
  increase(productId: string, qty: number): Promise<ProductStock>;
  tryDecrease(productId: string, qty: number): Promise<ProductStock | null>;
}
