import type {
  CreateProductVariantInput,
  ProductVariant,
  UpdateProductVariantInput,
  VariantPropertyValue,
} from './product-variant.entity.ts';

export interface StockDecreaseItem {
  variantId: string;
  qty: number;
}

export type BatchStockResult = { ok: true } | { ok: false; variantId: string };

export interface ProductVariantRepo {
  listByProductId(productId: string): Promise<ProductVariant[]>;
  listByProductIds(productIds: string[]): Promise<Map<string, ProductVariant[]>>;
  findById(id: string): Promise<ProductVariant | null>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  create(
    productId: string,
    input: CreateProductVariantInput,
  ): Promise<ProductVariant>;
  update(
    id: string,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariant | null>;
  delete(id: string): Promise<boolean>;
  increaseStock(variantId: string, qty: number): Promise<ProductVariant>;
  setStock(variantId: string, qty: number): Promise<ProductVariant>;
  tryDecreaseStock(variantId: string, qty: number): Promise<ProductVariant | null>;
  tryDecreaseStockBatch(items: StockDecreaseItem[]): Promise<BatchStockResult>;
  getPropertyValues(variantId: string): Promise<VariantPropertyValue[]>;
  getPropertyValuesByVariantIds(
    variantIds: string[],
  ): Promise<Map<string, VariantPropertyValue[]>>;
  setPropertyValues(
    variantId: string,
    values: Array<{ propertyId: string; value: string }>,
  ): Promise<void>;
}
