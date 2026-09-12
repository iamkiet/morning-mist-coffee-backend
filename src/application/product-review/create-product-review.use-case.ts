import { NotFoundError } from '../../lib/errors.ts';
import type {
  CreateProductReviewInput,
  ProductReview,
} from '../../domain/product-review/product-review.entity.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { applyReviewClassification } from './apply-review-classification.ts';

export class CreateProductReviewUseCase {
  constructor(
    private readonly repo: ProductReviewRepo,
    private readonly products: ProductRepo,
    private readonly classification: ReviewClassificationPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreateProductReviewInput): Promise<ProductReview> {
    const product = await this.products.findById(input.productId);
    if (!product) throw new NotFoundError('Product', input.productId);

    const review = await this.repo.create(input);
    return applyReviewClassification(
      this.repo,
      this.products,
      this.classification,
      this.logger,
      review,
    );
  }
}
