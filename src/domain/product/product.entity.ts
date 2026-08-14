import type { SortDirection } from '../shared/pagination.ts';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  image?: string | null;
}

export type CreateProductRecord = CreateProductInput & { slug: string };

export interface UpdateProductInput {
  slug?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
}

export type ProductSortField = 'createdAt' | 'name';

export interface ProductFilterCriteria {
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  q?: string;
}

export interface ListProductsFilter extends ProductFilterCriteria {
  sortBy: ProductSortField;
  sortDir: SortDirection;
  limit: number;
  offset: number;
}

export type PriceRange = Pick<ListProductsFilter, 'priceMin' | 'priceMax'>;

export interface ProductSearchFilter extends PriceRange {
  categoryId?: string;
}

export interface ProductEmbeddingSource {
  name: string;
  description: string | null;
  categoryNames: string[];
  propertyValues: Array<{ propertyName: string; value: string }>;
}
