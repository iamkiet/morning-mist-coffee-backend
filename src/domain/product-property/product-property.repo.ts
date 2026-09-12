import type {
  CreateProductPropertyInput,
  ProductProperty,
} from './product-property.entity.ts';

export interface ProductPropertyRepo {
  list(): Promise<ProductProperty[]>;
  findById(id: string): Promise<ProductProperty | null>;
  findByIds(ids: string[]): Promise<ProductProperty[]>;
  findByName(name: string): Promise<ProductProperty | null>;
  create(input: CreateProductPropertyInput): Promise<ProductProperty>;
}
