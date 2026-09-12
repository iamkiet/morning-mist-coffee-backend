import type { SortDirection } from '../shared/pagination.ts';

export const REVIEW_SOURCES = ['app', 'google', 'facebook', 'form'] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const REVIEW_CATEGORIES = [
  'complaint',
  'compliment',
  'suggestion',
  'spam',
] as const;
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export const REVIEW_SEVERITIES = ['low', 'medium', 'high'] as const;
export type ReviewSeverity = (typeof REVIEW_SEVERITIES)[number];

export const REVIEW_SENTIMENTS = ['positive', 'negative', 'neutral'] as const;
export type ReviewSentiment = (typeof REVIEW_SENTIMENTS)[number];

export const REVIEW_STATUSES = [
  'pending_classification',
  'pending_review',
  'auto_responded',
  'escalated',
  'resolved',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_REPLY_AUTHOR_TYPES = ['admin', 'customer', 'ai'] as const;
export type ReviewReplyAuthorType = (typeof REVIEW_REPLY_AUTHOR_TYPES)[number];

export interface OrderReviewReply {
  id: string;
  reviewId: string;
  authorType: ReviewReplyAuthorType;
  authorName: string | null;
  replyText: string;
  createdAt: Date;
}

export interface CreateOrderReviewReplyInput {
  authorType: ReviewReplyAuthorType;
  authorName?: string;
  replyText: string;
}

export interface OrderReview {
  id: string;
  productId: string | null;
  orderId: string | null;
  customerEmail: string | null;
  rating: number | null;
  commentText: string;
  source: ReviewSource;
  category: ReviewCategory | null;
  severity: ReviewSeverity | null;
  sentiment: ReviewSentiment | null;
  topics: string[] | null;
  suggestedResponse: string | null;
  classificationRaw: unknown;
  classifiedAt: Date | null;
  status: ReviewStatus;
  replies: OrderReviewReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderReviewInput {
  productId?: string;
  orderId: string;
  customerEmail?: string;
  rating?: number;
  commentText: string;
  source: ReviewSource;
}

export interface ClassifyOrderReviewInput {
  category: ReviewCategory;
  severity: ReviewSeverity;
  sentiment: ReviewSentiment;
  topics: string[];
  suggestedResponse: string;
  classificationRaw: unknown;
  classifiedAt: Date;
  status: ReviewStatus;
}

export interface UpdateOrderReviewStatusInput {
  status: ReviewStatus;
}

export type OrderReviewSortField = 'createdAt';

export interface ListOrderReviewsFilter {
  status?: ReviewStatus;
  severity?: ReviewSeverity;
  category?: ReviewCategory;
  productId?: string;
  sortBy: OrderReviewSortField;
  sortDir: SortDirection;
  limit: number;
  offset: number;
}
