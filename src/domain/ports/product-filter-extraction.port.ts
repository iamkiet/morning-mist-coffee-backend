import type { PriceRange } from '../product/product.entity.ts';

export interface ProductFilterExtractionPort {
  extract(question: string): Promise<PriceRange | null>;
}
