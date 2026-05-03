import { NotFoundError } from '../../lib/errors.js';
import type { Product } from '../../domain/product/product.entity.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export class GetProductByIdUseCase {
  constructor(private readonly repo: ProductRepo) {}

  async execute(id: string): Promise<Product> {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundError('Product', id);
    return product;
  }
}
