import { z } from 'zod';
import {
  REVIEW_CATEGORIES,
  REVIEW_SENTIMENTS,
  REVIEW_SEVERITIES,
  REVIEW_SOURCES,
  REVIEW_STATUSES,
} from '../../domain/order-review/order-review.entity.ts';
import {
  paginatedResponse,
  paginationFields,
  sortFields,
} from './_pagination.ts';

export const ReviewSource = z.enum(REVIEW_SOURCES);
export const ReviewCategory = z.enum(REVIEW_CATEGORIES);
export const ReviewSeverity = z.enum(REVIEW_SEVERITIES);
export const ReviewSentiment = z.enum(REVIEW_SENTIMENTS);
export const ReviewStatus = z.enum(REVIEW_STATUSES);

export const OrderReviewSchema = z.object({
  id: z.uuid(),
  productId: z.uuid().nullable(),
  orderId: z.uuid().nullable(),
  customerEmail: z.email().nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  commentText: z.string(),
  source: ReviewSource,
  category: ReviewCategory.nullable(),
  severity: ReviewSeverity.nullable(),
  sentiment: ReviewSentiment.nullable(),
  topics: z.array(z.string()).nullable(),
  suggestedResponse: z.string().nullable(),
  status: ReviewStatus,
  classifiedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateOrderReviewBody = z.object({
  productId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  customerEmail: z.email().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  commentText: z.string().min(1).max(2000),
  source: ReviewSource,
});

export const UpdateOrderReviewStatusBody = z.object({
  status: ReviewStatus,
});

export const OrderReviewIdParam = z.object({
  id: z.uuid(),
});

export const ListOrderReviewsQuery = z.object({
  status: ReviewStatus.optional(),
  severity: ReviewSeverity.optional(),
  category: ReviewCategory.optional(),
  productId: z.uuid().optional(),
  ...sortFields(['createdAt']),
  ...paginationFields,
});

export const OrderReviewListResponse = paginatedResponse(OrderReviewSchema);

export const PublicOrderReviewSchema = z.object({
  id: z.uuid(),
  rating: z.number().int().min(1).max(5).nullable(),
  commentText: z.string(),
  createdAt: z.iso.datetime(),
});

export const ProductIdParam = z.object({
  productId: z.uuid(),
});

export const ListPublicOrderReviewsQuery = z.object({
  ...paginationFields,
});

export const PublicOrderReviewListResponse = paginatedResponse(
  PublicOrderReviewSchema,
);

export type OrderReviewDTO = z.infer<typeof OrderReviewSchema>;
export type PublicOrderReviewDTO = z.infer<typeof PublicOrderReviewSchema>;
