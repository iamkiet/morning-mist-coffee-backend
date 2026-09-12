import type {
  OrderReview,
  OrderReviewReply,
} from '../../domain/order-review/order-review.entity.ts';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.ts';
import type {
  OrderReviewDTO,
  OrderReviewReplyDTO,
  PublicOrderReviewDTO,
  PublicOrderReviewReplyDTO,
} from '../schemas/order-review.schema.ts';

export function toOrderReviewReplyDTO(reply: OrderReviewReply): OrderReviewReplyDTO {
  return {
    id: reply.id,
    reviewId: reply.reviewId,
    authorType: reply.authorType,
    authorName: reply.authorName,
    replyText: reply.replyText,
    createdAt: reply.createdAt.toISOString(),
  };
}

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
    replies: review.replies.map(toOrderReviewReplyDTO),
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

function toPublicOrderReviewReplyDTO(
  reply: OrderReviewReply,
): PublicOrderReviewReplyDTO {
  return {
    id: reply.id,
    authorType: reply.authorType,
    authorName: reply.authorName,
    replyText: reply.replyText,
    createdAt: reply.createdAt.toISOString(),
  };
}

export function toPublicOrderReviewDTO(review: OrderReview): PublicOrderReviewDTO {
  return {
    id: review.id,
    rating: review.rating,
    commentText: review.commentText,
    replies: review.replies.map(toPublicOrderReviewReplyDTO),
    createdAt: review.createdAt.toISOString(),
  };
}

export function toPublicOrderReviewListPayload(
  result: Paginated<OrderReview>,
): Paginated<PublicOrderReviewDTO> {
  return mapPaginated(result, toPublicOrderReviewDTO);
}
