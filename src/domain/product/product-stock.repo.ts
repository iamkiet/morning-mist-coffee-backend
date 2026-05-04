import type { ProductStock } from './product-stock.entity.js';

export interface StockDecreaseItem {
  productId: string;
  qty: number;
}

export interface ProductStockRepo {
  getByProductId(productId: string): Promise<ProductStock>;
  getByProductIds(ids: string[]): Promise<Map<string, number>>;
  increase(productId: string, qty: number): Promise<ProductStock>;
  tryDecrease(productId: string, qty: number): Promise<ProductStock | null>;
  tryDecreaseBatch(items: StockDecreaseItem[]): Promise<boolean>;
}
