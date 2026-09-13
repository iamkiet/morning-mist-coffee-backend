import type {
  ProductReview,
  ReviewStatus,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';

export async function applyReviewClassification(
  repo: ProductReviewRepo,
  products: ProductRepo,
  classification: ReviewClassificationPort,
  logger: AppLogger,
  review: ProductReview,
): Promise<ProductReview> {
  const product = await products.findById(review.productId);

  const result = await classification.classify({
    rating: review.rating,
    commentText: review.commentText,
    productName: product?.name ?? null,
    source: review.source,
  });

  if (!result) {
    logger.warn(
      { event: 'product_review.classification_failed', reviewId: review.id },
      'Review classification failed, routing to pending_reply for manual handling',
    );
    const updated = await repo.updateStatus(review.id, 'pending_reply');
    return updated ?? review;
  }

  const status: ReviewStatus =
    result.confidence === 'low' || result.severity === 'high'
      ? 'pending_reply'
      : 'auto_responded';

  const reply =
    status === 'auto_responded' && result.suggestedResponse
      ? { authorType: 'ai' as const, authorName: 'Morning Mist Coffee', replyText: result.suggestedResponse }
      : undefined;

  const classified = await repo.classifyWithReply(
    review.id,
    {
      category: result.category,
      severity: result.severity,
      sentiment: result.sentiment,
      topics: result.topics,
      suggestedResponse: result.suggestedResponse,
      classificationRaw: result,
      classifiedAt: new Date(),
      status,
    },
    reply,
  );

  return classified ?? review;
}
