import type { ProductProperty } from '../../domain/product-property/product-property.entity.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';

export class ListProductPropertiesUseCase {
  constructor(private readonly repo: ProductPropertyRepo) {}

  execute(): Promise<ProductProperty[]> {
    return this.repo.list();
  }
}
