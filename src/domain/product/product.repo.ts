import type {
  CreateProductInput,
  ListProductsFilter,
  Product,
  UpdateProductInput,
} from './product.entity.js';

export type ProductFilterCriteria = Omit<
  ListProductsFilter,
  'sortBy' | 'sortDir' | 'limit' | 'offset'
>;

export interface ProductRepo {
  list(filter: ListProductsFilter): Promise<Product[]>;
  count(filter: ProductFilterCriteria): Promise<number>;
  findById(id: string): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}
