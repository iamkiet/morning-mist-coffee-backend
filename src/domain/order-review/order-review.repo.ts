import type {
  ClassifyOrderReviewInput,
  CreateOrderReviewInput,
  ListOrderReviewsFilter,
  OrderReview,
  ReviewStatus,
} from './order-review.entity.ts';

export type OrderReviewFilterCriteria = Omit<
  ListOrderReviewsFilter,
  'sortBy' | 'sortDir' | 'limit' | 'offset'
>;

export interface OrderReviewRepo {
  list(filter: ListOrderReviewsFilter): Promise<OrderReview[]>;
  count(filter: OrderReviewFilterCriteria): Promise<number>;
  findById(id: string): Promise<OrderReview | null>;
  create(input: CreateOrderReviewInput): Promise<OrderReview>;
  classify(
    id: string,
    input: ClassifyOrderReviewInput,
  ): Promise<OrderReview | null>;
  updateStatus(id: string, status: ReviewStatus): Promise<OrderReview | null>;
}
