import { NotFoundError } from '../../lib/errors.ts';
import type {
  CreateOrderReviewInput,
  OrderReview,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { applyReviewClassification } from './apply-review-classification.ts';

export class CreateOrderReviewUseCase {
  constructor(
    private readonly repo: OrderReviewRepo,
    private readonly orders: OrderRepo,
    private readonly products: ProductRepo,
    private readonly classification: ReviewClassificationPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreateOrderReviewInput): Promise<OrderReview> {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new NotFoundError('Order', input.orderId);

    const review = await this.repo.create(input);
    return applyReviewClassification(
      this.repo,
      this.products,
      this.classification,
      this.logger,
      review,
    );
  }
}
