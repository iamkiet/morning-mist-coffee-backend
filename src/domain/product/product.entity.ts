import type { Currency } from '../shared/currency.ts';
import type { SortDirection } from '../shared/pagination.ts';

export interface Product {
  id: string;
  slug: string;
  name: string;
  origin: string | null;
  tastingNotes: string[];
  description: string | null;
  priceCents: number;
  currency: Currency;
  image: string | null;
  productTypeId: string;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  origin?: string | null;
  tastingNotes?: string[];
  description?: string | null;
  priceCents: number;
  currency?: Currency;
  image?: string | null;
  productTypeId: string;
}

export type CreateProductRecord = CreateProductInput & { slug: string };

export interface UpdateProductInput {
  slug?: string;
  name?: string;
  origin?: string | null;
  tastingNotes?: string[];
  description?: string | null;
  priceCents?: number;
  currency?: Currency;
  image?: string | null;
  productTypeId?: string;
  stockQuantity?: number;
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

export type PriceRange = Pick<ListProductsFilter, 'priceMin' | 'priceMax'>;
