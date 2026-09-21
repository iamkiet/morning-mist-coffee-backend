import type { PriceRange } from '../product/product.entity.ts';

export interface ExtractedProductFilter extends PriceRange {
  weight?: string;
  quantity?: number;
}

export interface ChatFilterExtractionPort {
  extract(question: string): Promise<ExtractedProductFilter | null>;
}
