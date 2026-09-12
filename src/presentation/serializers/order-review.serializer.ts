import type { OrderReview } from '../../domain/order-review/order-review.entity.ts';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.ts';
import type {
  OrderReviewDTO,
  PublicOrderReviewDTO,
} from '../schemas/order-review.schema.ts';

export function toOrderReviewDTO(review: OrderReview): OrderReviewDTO {
  return {
    id: review.id,
    productId: review.productId,
    orderId: review.orderId,
    customerEmail: review.customerEmail,
    rating: review.rating,
    commentText: review.commentText,
    source: review.source,
    category: review.category,
    severity: review.severity,
    sentiment: review.sentiment,
    topics: review.topics,
    suggestedResponse: review.suggestedResponse,
    status: review.status,
    classifiedAt: review.classifiedAt ? review.classifiedAt.toISOString() : null,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export function toOrderReviewListPayload(
  result: Paginated<OrderReview>,
): Paginated<OrderReviewDTO> {
  return mapPaginated(result, toOrderReviewDTO);
}

export function toPublicOrderReviewDTO(review: OrderReview): PublicOrderReviewDTO {
  return {
    id: review.id,
    rating: review.rating,
    commentText: review.commentText,
    createdAt: review.createdAt.toISOString(),
  };
}

export function toPublicOrderReviewListPayload(
  result: Paginated<OrderReview>,
): Paginated<PublicOrderReviewDTO> {
  return mapPaginated(result, toPublicOrderReviewDTO);
}
