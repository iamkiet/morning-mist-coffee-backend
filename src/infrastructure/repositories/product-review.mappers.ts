import { and, eq, isNull, ne, or, type SQL } from 'drizzle-orm';
import { groupBy } from '../../lib/group-by.ts';
import type {
  ProductReview,
  ProductReviewReply,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewFilterCriteria } from '../../domain/product-review/product-review.repo.ts';
import {
  productReviews,
  type ProductReviewReplyRow,
  type ProductReviewRow,
} from '../db/schema.ts';

// Every non-spam review is public immediately on submit, regardless of
// classification status — a reply (AI or admin) is added later, it doesn't
// gate visibility. `category` is null until classification runs (or if it
// never completes), so this must allow null explicitly — `category != 'spam'`
// alone evaluates to NULL (excluded) for a null category in SQL.
export function publicProductReviewWhere(productId: string): SQL {
  return and(
    eq(productReviews.productId, productId),
    or(isNull(productReviews.category), ne(productReviews.category, 'spam')),
  ) as SQL;
}

export function buildProductReviewFilters(
  filter: ProductReviewFilterCriteria,
): SQL[] {
  const filters: SQL[] = [];
  if (filter.status) filters.push(eq(productReviews.status, filter.status));
  if (filter.severity) filters.push(eq(productReviews.severity, filter.severity));
  if (filter.category) filters.push(eq(productReviews.category, filter.category));
  if (filter.productId) filters.push(eq(productReviews.productId, filter.productId));
  return filters;
}

export function productReviewWhere(
  filter: ProductReviewFilterCriteria,
): SQL | undefined {
  const filters = buildProductReviewFilters(filter);
  return filters.length ? and(...filters) : undefined;
}

export function rowToReply(row: ProductReviewReplyRow): ProductReviewReply {
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
  rows: ProductReviewReplyRow[],
): Map<string, ProductReviewReply[]> {
  const byReview = groupBy(rows, (row) => row.reviewId);
  return new Map([...byReview].map(([reviewId, group]) => [reviewId, group.map(rowToReply)]));
}

export function rowToProductReview(
  row: ProductReviewRow,
  replies: ProductReviewReply[] = [],
): ProductReview {
  return {
    id: row.id,
    productId: row.productId,
    customerId: row.customerId,
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
