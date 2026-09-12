import { NotFoundError } from '../../lib/errors.ts';
import type {
  ProductReview,
  UpdateProductReviewStatusInput,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';

export class UpdateProductReviewStatusUseCase {
  constructor(private readonly repo: ProductReviewRepo) {}

  async execute(
    id: string,
    input: UpdateProductReviewStatusInput,
  ): Promise<ProductReview> {
    const updated = await this.repo.updateStatus(id, input.status);
    if (!updated) throw new NotFoundError('ProductReview', id);
    return updated;
  }
}
