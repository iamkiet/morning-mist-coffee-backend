import { and, eq, inArray, ne, type SQL } from 'drizzle-orm';
import type {
  ProductReview,
  ProductReviewReply,
  ReviewStatus,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewFilterCriteria } from '../../domain/product-review/product-review.repo.ts';
import {
  productReviews,
  type ProductReviewReplyRow,
  type ProductReviewRow,
} from '../db/schema.ts';

const PUBLIC_REVIEW_STATUSES: ReviewStatus[] = ['auto_responded', 'resolved'];

export function publicProductReviewWhere(productId: string): SQL {
  return and(
    eq(productReviews.productId, productId),
    ne(productReviews.category, 'spam'),
    inArray(productReviews.status, PUBLIC_REVIEW_STATUSES),
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
    customerId: row.customerId,
    replyText: row.replyText,
    createdAt: row.createdAt,
  };
}

export function groupRepliesByReview(
  rows: ProductReviewReplyRow[],
): Map<string, ProductReviewReply[]> {
  const repliesByReview = new Map<string, ProductReviewReply[]>();
  for (const row of rows) {
    const list = repliesByReview.get(row.reviewId) ?? [];
    list.push(rowToReply(row));
    repliesByReview.set(row.reviewId, list);
  }
  return repliesByReview;
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
