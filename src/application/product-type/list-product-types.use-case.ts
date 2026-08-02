import type { ProductType } from '../../domain/product-type/product-type.entity.ts';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.ts';

export class ListProductTypesUseCase {
  constructor(private readonly repo: ProductTypeRepo) {}

  execute(): Promise<ProductType[]> {
    return this.repo.list();
  }
}
