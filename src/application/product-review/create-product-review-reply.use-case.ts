import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import type {
  CreateProductReviewReplyInput,
  ProductReviewReply,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';

export class CreateProductReviewReplyUseCase {
  constructor(private readonly repo: ProductReviewRepo) {}

  async execute(
    reviewId: string,
    input: CreateProductReviewReplyInput,
  ): Promise<ProductReviewReply> {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundError('ProductReview', reviewId);
    if (review.replies.length > 0) {
      throw new ConflictError('This review already has a reply');
    }

    const reply = await this.repo.createReply(reviewId, input);

    // `pending_classification` is included because classification now runs
    // fire-and-forget — an admin can reply before it finishes.
    if (review.status === 'pending_reply' || review.status === 'pending_classification') {
      await this.repo.updateStatus(reviewId, 'resolved');
    }

    return reply;
  }
}
