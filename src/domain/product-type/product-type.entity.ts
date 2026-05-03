export interface ProductType {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductTypeInput {
  name: string;
}
