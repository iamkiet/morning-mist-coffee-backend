import type { PriceRange } from '../product/product.entity.ts';

export interface ExtractedProductFilter extends PriceRange {
  weight?: string;
}

export interface ProductFilterExtractionPort {
  extract(question: string): Promise<ExtractedProductFilter | null>;
}
