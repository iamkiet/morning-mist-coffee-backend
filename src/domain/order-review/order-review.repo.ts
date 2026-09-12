import type {
  ClassifyOrderReviewInput,
  CreateOrderReviewInput,
  CreateOrderReviewReplyInput,
  ListOrderReviewsFilter,
  OrderReview,
  OrderReviewReply,
  ReviewStatus,
} from './order-review.entity.ts';

export type OrderReviewFilterCriteria = Omit<
  ListOrderReviewsFilter,
  'sortBy' | 'sortDir' | 'limit' | 'offset'
>;

export interface OrderReviewRepo {
  list(filter: ListOrderReviewsFilter): Promise<OrderReview[]>;
  count(filter: OrderReviewFilterCriteria): Promise<number>;
  listPublic(
    productId: string,
    limit: number,
    offset: number,
  ): Promise<OrderReview[]>;
  countPublic(productId: string): Promise<number>;
  findById(id: string): Promise<OrderReview | null>;
  create(input: CreateOrderReviewInput): Promise<OrderReview>;
  classify(
    id: string,
    input: ClassifyOrderReviewInput,
  ): Promise<OrderReview | null>;
  updateStatus(id: string, status: ReviewStatus): Promise<OrderReview | null>;
  createReply(
    reviewId: string,
    input: CreateOrderReviewReplyInput,
  ): Promise<OrderReviewReply>;
}
