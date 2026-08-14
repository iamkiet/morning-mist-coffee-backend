import type { Currency } from '../shared/currency.ts';
import type { Product } from './product.entity.ts';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  priceCents: number;
  currency: Currency;
  stock: number;
  expiresAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductVariantInput {
  sku: string;
  priceCents: number;
  currency?: Currency;
  stock?: number;
  expiresAt?: string | null;
}

export interface UpdateProductVariantInput {
  sku?: string;
  priceCents?: number;
  currency?: Currency;
  stock?: number;
  expiresAt?: string | null;
}

export interface VariantPropertyValue {
  propertyId: string;
  propertyName: string;
  value: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface StockChange {
  quantity: number;
}
