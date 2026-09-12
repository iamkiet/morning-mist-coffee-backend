import type {
  CreateProductCategoryInput,
  ProductCategory,
  UpdateProductCategoryInput,
} from './product-category.entity.ts';

export interface ProductCategoryRepo {
  list(): Promise<ProductCategory[]>;
  findById(id: string): Promise<ProductCategory | null>;
  findByIds(ids: string[]): Promise<ProductCategory[]>;
  findByName(name: string): Promise<ProductCategory | null>;
  create(input: CreateProductCategoryInput): Promise<ProductCategory>;
  update(
    id: string,
    input: UpdateProductCategoryInput,
  ): Promise<ProductCategory | null>;
  delete(id: string): Promise<boolean>;
  hasChildren(id: string): Promise<boolean>;
  getCategoryIdsForProduct(productId: string): Promise<string[]>;
  getCategoryIdsForProducts(productIds: string[]): Promise<Map<string, string[]>>;
  setCategoriesForProduct(
    productId: string,
    categoryIds: string[],
  ): Promise<void>;
}
