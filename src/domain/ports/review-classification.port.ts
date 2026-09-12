import type {
  ReviewCategory,
  ReviewSentiment,
  ReviewSeverity,
  ReviewSource,
} from '../order-review/order-review.entity.ts';

export interface ReviewClassificationInput {
  rating: number | null;
  commentText: string;
  productName: string | null;
  source: ReviewSource;
}

export interface ReviewClassificationResult {
  category: ReviewCategory;
  severity: ReviewSeverity;
  sentiment: ReviewSentiment;
  topics: string[];
  suggestedResponse: string;
  confidence: 'high' | 'low';
}

export interface ReviewClassificationPort {
  classify(
    input: ReviewClassificationInput,
  ): Promise<ReviewClassificationResult | null>;
}
