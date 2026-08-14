import type {
  CreateProductRecord,
  ListProductsFilter,
  Product,
  ProductEmbeddingSource,
  ProductFilterCriteria,
  ProductSearchFilter,
  UpdateProductInput,
} from './product.entity.ts';

export type { ProductFilterCriteria };

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
  getEmbeddingSource(id: string): Promise<ProductEmbeddingSource | null>;
  findSimilarByVector(
    embedding: number[],
    limit: number,
    filter?: ProductSearchFilter,
  ): Promise<SimilarProduct[]>;
}
