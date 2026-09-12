import type {
  ProductReview,
  ProductReviewReply,
} from '../../domain/product-review/product-review.entity.ts';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.ts';
import type {
  ProductReviewDTO,
  ProductReviewReplyDTO,
  PublicProductReviewDTO,
  PublicProductReviewReplyDTO,
} from '../schemas/product-review.schema.ts';

export function toProductReviewReplyDTO(reply: ProductReviewReply): ProductReviewReplyDTO {
  return {
    id: reply.id,
    reviewId: reply.reviewId,
    authorType: reply.authorType,
    authorName: reply.authorName,
    replyText: reply.replyText,
    createdAt: reply.createdAt.toISOString(),
  };
}

export function toProductReviewDTO(review: ProductReview): ProductReviewDTO {
  return {
    id: review.id,
    productId: review.productId,
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
    replies: review.replies.map(toProductReviewReplyDTO),
    classifiedAt: review.classifiedAt ? review.classifiedAt.toISOString() : null,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export function toProductReviewListPayload(
  result: Paginated<ProductReview>,
): Paginated<ProductReviewDTO> {
  return mapPaginated(result, toProductReviewDTO);
}

function toPublicProductReviewReplyDTO(
  reply: ProductReviewReply,
): PublicProductReviewReplyDTO {
  return {
    id: reply.id,
    authorType: reply.authorType,
    authorName: reply.authorName,
    replyText: reply.replyText,
    createdAt: reply.createdAt.toISOString(),
  };
}

export function toPublicProductReviewDTO(review: ProductReview): PublicProductReviewDTO {
  return {
    id: review.id,
    rating: review.rating,
    commentText: review.commentText,
    replies: review.replies.map(toPublicProductReviewReplyDTO),
    createdAt: review.createdAt.toISOString(),
  };
}

export function toPublicProductReviewListPayload(
  result: Paginated<ProductReview>,
): Paginated<PublicProductReviewDTO> {
  return mapPaginated(result, toPublicProductReviewDTO);
}
