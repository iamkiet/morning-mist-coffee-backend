import type { Currency } from '../shared/currency.js';
import type { SortDirection } from '../shared/pagination.js';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: Currency;
  image: string | null;
  productTypeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: Currency;
  image?: string | null;
  productTypeId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  priceCents?: number;
  currency?: Currency;
  image?: string | null;
  productTypeId?: string;
}

export type ProductSortField = 'createdAt' | 'name' | 'priceCents';

export interface ListProductsFilter {
  productTypeId?: string;
  currency?: Currency;
  priceMin?: number;
  priceMax?: number;
  q?: string;
  sortBy: ProductSortField;
  sortDir: SortDirection;
  limit: number;
  offset: number;
}
