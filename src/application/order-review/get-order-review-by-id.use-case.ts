import { NotFoundError } from '../../lib/errors.ts';
import type { OrderReview } from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';

export class GetOrderReviewByIdUseCase {
  constructor(private readonly repo: OrderReviewRepo) {}

  async execute(id: string): Promise<OrderReview> {
    const review = await this.repo.findById(id);
    if (!review) throw new NotFoundError('OrderReview', id);
    return review;
  }
}
