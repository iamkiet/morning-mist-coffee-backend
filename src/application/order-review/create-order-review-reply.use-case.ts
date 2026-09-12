import { NotFoundError } from '../../lib/errors.ts';
import type {
  CreateOrderReviewReplyInput,
  OrderReviewReply,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { applyReviewClassification } from './apply-review-classification.ts';

export class CreateOrderReviewReplyUseCase {
  constructor(
    private readonly repo: OrderReviewRepo,
    private readonly products: ProductRepo,
    private readonly classification: ReviewClassificationPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    reviewId: string,
    input: CreateOrderReviewReplyInput,
  ): Promise<OrderReviewReply> {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundError('OrderReview', reviewId);

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
