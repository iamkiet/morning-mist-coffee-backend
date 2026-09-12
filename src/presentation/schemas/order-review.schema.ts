import { z } from 'zod';
import {
  REVIEW_CATEGORIES,
  REVIEW_REPLY_AUTHOR_TYPES,
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
export const ReviewReplyAuthorType = z.enum(REVIEW_REPLY_AUTHOR_TYPES);

export const OrderReviewReplySchema = z.object({
  id: z.uuid(),
  reviewId: z.uuid(),
  authorType: ReviewReplyAuthorType,
  authorName: z.string().nullable(),
  replyText: z.string(),
  createdAt: z.iso.datetime(),
});

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
  replies: z.array(OrderReviewReplySchema),
  classifiedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateOrderReviewBody = z.object({
  productId: z.uuid().optional(),
  orderId: z.uuid('Mã đơn hàng không hợp lệ'),
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

export const OrderReviewReplyParams = z.object({
  reviewId: z.uuid(),
});

export const CreateOrderReviewReplyBody = z.object({
  authorName: z.string().min(1).max(100).optional(),
  replyText: z.string().min(1).max(1000),
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

export const PublicOrderReviewReplySchema = z.object({
  id: z.uuid(),
  authorType: ReviewReplyAuthorType,
  authorName: z.string().nullable(),
  replyText: z.string(),
  createdAt: z.iso.datetime(),
});

export const PublicOrderReviewSchema = z.object({
  id: z.uuid(),
  rating: z.number().int().min(1).max(5).nullable(),
  commentText: z.string(),
  replies: z.array(PublicOrderReviewReplySchema),
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
export type OrderReviewReplyDTO = z.infer<typeof OrderReviewReplySchema>;
export type PublicOrderReviewDTO = z.infer<typeof PublicOrderReviewSchema>;
export type PublicOrderReviewReplyDTO = z.infer<
  typeof PublicOrderReviewReplySchema
>;
