import { NotFoundError } from '../../lib/errors.ts';
import type {
  CreateProductReviewReplyInput,
  ProductReviewReply,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { applyReviewClassification } from './apply-review-classification.ts';

export class CreateProductReviewReplyUseCase {
  constructor(
    private readonly repo: ProductReviewRepo,
    private readonly products: ProductRepo,
    private readonly classification: ReviewClassificationPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    reviewId: string,
    input: CreateProductReviewReplyInput,
  ): Promise<ProductReviewReply> {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundError('ProductReview', reviewId);

    const reply = await this.repo.createReply(reviewId, input);

    if (input.authorType === 'customer') {
      await applyReviewClassification(
        this.repo,
        this.products,
        this.classification,
        this.logger,
        review,
        input.replyText,
      );
    }

    return reply;
  }
}
