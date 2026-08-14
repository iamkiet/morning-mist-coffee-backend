import type {
  CreateProductCategoryInput,
  ProductCategory,
} from './product-category.entity.ts';

export interface ProductCategoryRepo {
  list(): Promise<ProductCategory[]>;
  findById(id: string): Promise<ProductCategory | null>;
  findByName(name: string): Promise<ProductCategory | null>;
  create(input: CreateProductCategoryInput): Promise<ProductCategory>;
  getCategoryIdsForProduct(productId: string): Promise<string[]>;
  setCategoriesForProduct(
    productId: string,
    categoryIds: string[],
  ): Promise<void>;
}
