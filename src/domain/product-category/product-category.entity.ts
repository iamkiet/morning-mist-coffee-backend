export interface ProductCategory {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CreateProductCategoryInput {
  name: string;
}

export interface UpdateProductCategoryInput {
  name?: string;
}
