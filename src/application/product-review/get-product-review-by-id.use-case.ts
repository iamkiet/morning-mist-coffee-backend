import { NotFoundError } from '../../lib/errors.ts';
import type { ProductReview } from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';

export class GetProductReviewByIdUseCase {
  constructor(private readonly repo: ProductReviewRepo) {}

  async execute(id: string): Promise<ProductReview> {
    const review = await this.repo.findById(id);
    if (!review) throw new NotFoundError('ProductReview', id);
    return review;
  }
}
