import { and, eq, inArray, ne, type SQL } from 'drizzle-orm';
import type {
  OrderReview,
  OrderReviewReply,
  ReviewStatus,
} from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewFilterCriteria } from '../../domain/order-review/order-review.repo.ts';
import {
  orderReviews,
  type OrderReviewReplyRow,
  type OrderReviewRow,
} from '../db/schema.ts';

const PUBLIC_REVIEW_STATUSES: ReviewStatus[] = ['auto_responded', 'resolved'];

export function publicOrderReviewWhere(productId: string): SQL {
  return and(
    eq(orderReviews.productId, productId),
    ne(orderReviews.category, 'spam'),
    inArray(orderReviews.status, PUBLIC_REVIEW_STATUSES),
  ) as SQL;
}

export function buildOrderReviewFilters(
  filter: OrderReviewFilterCriteria,
): SQL[] {
  const filters: SQL[] = [];
  if (filter.status) filters.push(eq(orderReviews.status, filter.status));
  if (filter.severity) filters.push(eq(orderReviews.severity, filter.severity));
  if (filter.category) filters.push(eq(orderReviews.category, filter.category));
  if (filter.productId) filters.push(eq(orderReviews.productId, filter.productId));
  return filters;
}

export function orderReviewWhere(
  filter: OrderReviewFilterCriteria,
): SQL | undefined {
  const filters = buildOrderReviewFilters(filter);
  return filters.length ? and(...filters) : undefined;
}

export function rowToReply(row: OrderReviewReplyRow): OrderReviewReply {
  return {
    id: row.id,
    reviewId: row.reviewId,
    authorType: row.authorType,
    authorName: row.authorName,
    replyText: row.replyText,
    createdAt: row.createdAt,
  };
}

export function groupRepliesByReview(
  rows: OrderReviewReplyRow[],
): Map<string, OrderReviewReply[]> {
  const repliesByReview = new Map<string, OrderReviewReply[]>();
  for (const row of rows) {
    const list = repliesByReview.get(row.reviewId) ?? [];
    list.push(rowToReply(row));
    repliesByReview.set(row.reviewId, list);
  }
  return repliesByReview;
}

export function rowToOrderReview(
  row: OrderReviewRow,
  replies: OrderReviewReply[] = [],
): OrderReview {
  return {
    id: row.id,
    productId: row.productId,
    orderId: row.orderId,
    customerEmail: row.customerEmail,
    rating: row.rating,
    commentText: row.commentText,
    source: row.source,
    category: row.category,
    severity: row.severity,
    sentiment: row.sentiment,
    topics: row.topics,
    suggestedResponse: row.suggestedResponse,
    classificationRaw: row.classificationRaw,
    classifiedAt: row.classifiedAt,
    status: row.status,
    replies,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
