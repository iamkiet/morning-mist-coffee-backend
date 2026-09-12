export interface ProductCategory {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export interface CreateProductCategoryInput {
  name: string;
  parentId?: string | null;
}

export interface UpdateProductCategoryInput {
  name?: string;
  parentId?: string | null;
}
