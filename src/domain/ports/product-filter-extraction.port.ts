import type { PriceRange } from '../product/product.repo.ts';

export interface ProductFilterExtractionPort {
  extract(question: string): Promise<PriceRange | null>;
}
