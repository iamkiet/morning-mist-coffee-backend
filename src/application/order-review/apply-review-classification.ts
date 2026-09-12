import type {
  OrderReview,
  ReviewStatus,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewRepo } from '../../domain/order-review/order-review.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';

export async function applyReviewClassification(
  repo: OrderReviewRepo,
  products: ProductRepo,
  classification: ReviewClassificationPort,
  logger: AppLogger,
  review: OrderReview,
): Promise<OrderReview> {
  const product = review.productId
    ? await products.findById(review.productId)
    : null;

  const result = await classification.classify({
    rating: review.rating,
    commentText: review.commentText,
    productName: product?.name ?? null,
    source: review.source,
  });

  if (!result) {
    logger.warn(
      { event: 'order_review.classification_failed', reviewId: review.id },
      'Review classification failed, routing to pending_review for manual handling',
    );
    const updated = await repo.updateStatus(review.id, 'pending_review');
    return updated ?? review;
  }

  const status: ReviewStatus =
    result.confidence === 'low' || result.severity === 'high'
      ? 'pending_review'
      : 'auto_responded';

  const classified = await repo.classify(review.id, {
    category: result.category,
    severity: result.severity,
    sentiment: result.sentiment,
    topics: result.topics,
    suggestedResponse: result.suggestedResponse,
    classificationRaw: result,
    classifiedAt: new Date(),
    status,
  });
  if (!classified) return review;

  if (status === 'auto_responded' && result.suggestedResponse) {
    const reply = await repo.createReply(review.id, {
      authorType: 'ai',
      authorName: 'Morning Mist Coffee',
      replyText: result.suggestedResponse,
    });
    classified.replies = [...classified.replies, reply];
  }

  return classified;
}
