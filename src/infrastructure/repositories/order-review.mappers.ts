import { and, eq, type SQL } from 'drizzle-orm';
import type { OrderReview } from '../../domain/order-review/order-review.entity.ts';
import type { OrderReviewFilterCriteria } from '../../domain/order-review/order-review.repo.ts';
import { orderReviews, type OrderReviewRow } from '../db/schema.ts';

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

export function rowToOrderReview(row: OrderReviewRow): OrderReview {
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
