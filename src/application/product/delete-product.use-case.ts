import { NotFoundError } from '../../lib/errors.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';

export class DeleteProductUseCase {
  constructor(private readonly repo: ProductRepo) {}

  async execute(id: string): Promise<void> {
    const ok = await this.repo.delete(id);
    if (!ok) throw new NotFoundError('Product', id);
  }
}
