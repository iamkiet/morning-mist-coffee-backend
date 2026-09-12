import { NotFoundError } from '../../lib/errors.ts';
import type {
  CreateOrderReviewReplyInput,
  OrderReviewReply,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';

export class CreateOrderReviewReplyUseCase {
  constructor(private readonly repo: OrderReviewRepo) {}

  async execute(
    reviewId: string,
    input: CreateOrderReviewReplyInput,
  ): Promise<OrderReviewReply> {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundError('OrderReview', reviewId);
    return this.repo.createReply(reviewId, input);
  }
}
