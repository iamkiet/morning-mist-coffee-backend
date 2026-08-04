import type {
  CreateProductRecord,
  ListProductsFilter,
  PriceRange,
  Product,
  UpdateProductInput,
} from './product.entity.ts';

export type ProductFilterCriteria = Omit<
  ListProductsFilter,
  'sortBy' | 'sortDir' | 'limit' | 'offset'
>;

export interface SimilarProduct {
  product: Product;
  score: number;
}

export interface ProductRepo {
  list(filter: ListProductsFilter): Promise<Product[]>;
  count(filter: ProductFilterCriteria): Promise<number>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  create(input: CreateProductRecord): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  updateEmbedding(id: string, embedding: number[] | null): Promise<void>;
  findSimilarByVector(
    embedding: number[],
    limit: number,
    priceFilter?: PriceRange,
  ): Promise<SimilarProduct[]>;
}
