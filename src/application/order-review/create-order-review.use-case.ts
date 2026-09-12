import type {
  CreateOrderReviewInput,
  OrderReview,
  ReviewStatus,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';

export class CreateOrderReviewUseCase {
  constructor(
    private readonly repo: OrderReviewRepo,
    private readonly products: ProductRepo,
    private readonly classification: ReviewClassificationPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreateOrderReviewInput): Promise<OrderReview> {
    const review = await this.repo.create(input);

    const product = input.productId
      ? await this.products.findById(input.productId)
      : null;

    const result = await this.classification.classify({
      rating: review.rating,
      commentText: review.commentText,
      productName: product?.name ?? null,
      source: review.source,
    });

    if (!result) {
      this.logger.warn(
        { event: 'order_review.classification_failed', reviewId: review.id },
        'Review classification failed, leaving review pending_classification for retry',
      );
      return review;
    }

    const status: ReviewStatus =
      result.confidence === 'low' || result.severity === 'high'
        ? 'pending_review'
        : 'auto_responded';

    const classified = await this.repo.classify(review.id, {
      category: result.category,
      severity: result.severity,
      sentiment: result.sentiment,
      topics: result.topics,
      suggestedResponse: result.suggestedResponse,
      classificationRaw: result,
      classifiedAt: new Date(),
      status,
    });

    return classified ?? review;
  }
}
