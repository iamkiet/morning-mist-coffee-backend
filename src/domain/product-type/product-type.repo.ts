import type { CreateProductTypeInput, ProductType } from './product-type.entity.js';

export interface ProductTypeRepo {
  list(): Promise<ProductType[]>;
  findById(id: string): Promise<ProductType | null>;
  findByName(name: string): Promise<ProductType | null>;
  create(input: CreateProductTypeInput): Promise<ProductType>;
}
