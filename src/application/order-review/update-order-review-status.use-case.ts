import { NotFoundError } from '../../lib/errors.ts';
import type {
  OrderReview,
  UpdateOrderReviewStatusInput,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';

export class UpdateOrderReviewStatusUseCase {
  constructor(private readonly repo: OrderReviewRepo) {}

  async execute(
    id: string,
    input: UpdateOrderReviewStatusInput,
  ): Promise<OrderReview> {
    const updated = await this.repo.updateStatus(id, input.status);
    if (!updated) throw new NotFoundError('OrderReview', id);
    return updated;
  }
}
