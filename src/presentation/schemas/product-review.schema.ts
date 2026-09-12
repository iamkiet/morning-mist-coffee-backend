import { z } from 'zod';
import {
  REVIEW_CATEGORIES,
  REVIEW_REPLY_AUTHOR_TYPES,
  REVIEW_SENTIMENTS,
  REVIEW_SEVERITIES,
  REVIEW_SOURCES,
  REVIEW_STATUSES,
} from '../../domain/product-review/product-review.entity.ts';
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

export const ProductReviewReplySchema = z.object({
  id: z.uuid(),
  reviewId: z.uuid(),
  authorType: ReviewReplyAuthorType,
  authorName: z.string().nullable(),
  replyText: z.string(),
  createdAt: z.iso.datetime(),
});

export const ProductReviewSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  customerEmail: z.email(),
  rating: z.number().int().min(1).max(5).nullable(),
  commentText: z.string(),
  source: ReviewSource,
  category: ReviewCategory.nullable(),
  severity: ReviewSeverity.nullable(),
  sentiment: ReviewSentiment.nullable(),
  topics: z.array(z.string()).nullable(),
  suggestedResponse: z.string().nullable(),
  status: ReviewStatus,
  replies: z.array(ProductReviewReplySchema),
  classifiedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateProductReviewBody = z.object({
  productId: z.uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  commentText: z.string().min(1).max(2000),
  source: ReviewSource,
});

export const UpdateProductReviewStatusBody = z.object({
  status: ReviewStatus,
});

export const ProductReviewIdParam = z.object({
  id: z.uuid(),
});

export const ProductReviewReplyParams = z.object({
  reviewId: z.uuid(),
});

export const CreateProductReviewReplyBody = z.object({
  authorName: z.string().min(1).max(100).optional(),
  replyText: z.string().min(1).max(1000),
});

export const ListProductReviewsQuery = z.object({
  status: ReviewStatus.optional(),
  severity: ReviewSeverity.optional(),
  category: ReviewCategory.optional(),
  productId: z.uuid().optional(),
  ...sortFields(['createdAt']),
  ...paginationFields,
});

export const ProductReviewListResponse = paginatedResponse(ProductReviewSchema);

export const PublicProductReviewReplySchema = z.object({
  id: z.uuid(),
  authorType: ReviewReplyAuthorType,
  authorName: z.string().nullable(),
  replyText: z.string(),
  createdAt: z.iso.datetime(),
});

export const PublicProductReviewSchema = z.object({
  id: z.uuid(),
  rating: z.number().int().min(1).max(5).nullable(),
  commentText: z.string(),
  replies: z.array(PublicProductReviewReplySchema),
  createdAt: z.iso.datetime(),
});

export const ProductIdParam = z.object({
  productId: z.uuid(),
});

export const ListPublicProductReviewsQuery = z.object({
  ...paginationFields,
});

export const PublicProductReviewListResponse = paginatedResponse(
  PublicProductReviewSchema,
);

export type ProductReviewDTO = z.infer<typeof ProductReviewSchema>;
export type ProductReviewReplyDTO = z.infer<typeof ProductReviewReplySchema>;
export type PublicProductReviewDTO = z.infer<typeof PublicProductReviewSchema>;
export type PublicProductReviewReplyDTO = z.infer<
  typeof PublicProductReviewReplySchema
>;
