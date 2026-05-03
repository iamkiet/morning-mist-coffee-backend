import type { ProductType } from '../../domain/product-type/product-type.entity.js';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.js';

export class ListProductTypesUseCase {
  constructor(private readonly repo: ProductTypeRepo) {}

  execute(): Promise<ProductType[]> {
    return this.repo.list();
  }
}
