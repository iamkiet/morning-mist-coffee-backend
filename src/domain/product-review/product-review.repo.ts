import type {
  ClassifyProductReviewInput,
  CreateProductReviewInput,
  CreateProductReviewReplyInput,
  ListProductReviewsFilter,
  ProductReview,
  ProductReviewReply,
  ReviewStatus,
} from './product-review.entity.ts';

export type ProductReviewFilterCriteria = Omit<
  ListProductReviewsFilter,
  'sortBy' | 'sortDir' | 'limit' | 'offset'
>;

export interface ProductReviewRepo {
  list(filter: ListProductReviewsFilter): Promise<ProductReview[]>;
  count(filter: ProductReviewFilterCriteria): Promise<number>;
  listPublic(
    productId: string,
    limit: number,
    offset: number,
  ): Promise<ProductReview[]>;
  countPublic(productId: string): Promise<number>;
  findById(id: string): Promise<ProductReview | null>;
  create(input: CreateProductReviewInput): Promise<ProductReview>;
  classify(
    id: string,
    input: ClassifyProductReviewInput,
  ): Promise<ProductReview | null>;
  updateStatus(id: string, status: ReviewStatus): Promise<ProductReview | null>;
  createReply(
    reviewId: string,
    input: CreateProductReviewReplyInput,
  ): Promise<ProductReviewReply>;
}
