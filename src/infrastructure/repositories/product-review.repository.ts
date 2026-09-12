import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { ExternalServiceError } from '../../lib/errors.ts';
import type {
  ClassifyProductReviewInput,
  CreateProductReviewInput,
  CreateProductReviewReplyInput,
  ListProductReviewsFilter,
  ProductReview,
  ProductReviewReply,
  ProductReviewSortField,
  ReviewStatus,
} from '../../domain/product-review/product-review.entity.ts';
import type {
  ProductReviewFilterCriteria,
  ProductReviewRepo,
} from '../../domain/product-review/product-review.repo.ts';
import type { DB } from '../db/client.ts';
import { productReviewReplies, productReviews, type ProductReviewRow } from '../db/schema.ts';
import {
  groupRepliesByReview,
  productReviewWhere,
  publicProductReviewWhere,
  rowToProductReview,
  rowToReply,
} from './product-review.mappers.ts';

const SORT_COLUMNS = {
  createdAt: productReviews.createdAt,
} as const satisfies Record<ProductReviewSortField, unknown>;

export class PostgresProductReviewRepository implements ProductReviewRepo {
  constructor(private readonly db: DB) {}

  private async findRepliesByReviewId(id: string): Promise<ProductReviewReply[]> {
    const rows = await this.db
      .select()
      .from(productReviewReplies)
      .where(eq(productReviewReplies.reviewId, id));
    return rows.map(rowToReply);
  }

  private async attachReplies(rows: ProductReviewRow[]): Promise<ProductReview[]> {
    if (rows.length === 0) return [];

    const replyRows = await this.db
      .select()
      .from(productReviewReplies)
      .where(
        inArray(
          productReviewReplies.reviewId,
          rows.map((r) => r.id),
        ),
      );

    const repliesByReview = groupRepliesByReview(replyRows);
    return rows.map((r) => rowToProductReview(r, repliesByReview.get(r.id) ?? []));
  }

  async list(filter: ListProductReviewsFilter): Promise<ProductReview[]> {
    const orderFn = filter.sortDir === 'asc' ? asc : desc;
    const sortColumn = SORT_COLUMNS[filter.sortBy];

    const rows = await this.db
      .select()
      .from(productReviews)
      .where(productReviewWhere(filter))
      .orderBy(orderFn(sortColumn), desc(productReviews.id))
      .limit(filter.limit)
      .offset(filter.offset);

    return this.attachReplies(rows);
  }

  async count(filter: ProductReviewFilterCriteria): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(productReviews)
      .where(productReviewWhere(filter));
    return row?.count ?? 0;
  }

  async listPublic(
    productId: string,
    limit: number,
    offset: number,
  ): Promise<ProductReview[]> {
    const rows = await this.db
      .select()
      .from(productReviews)
      .where(publicProductReviewWhere(productId))
      .orderBy(desc(productReviews.createdAt), desc(productReviews.id))
      .limit(limit)
      .offset(offset);

    return this.attachReplies(rows);
  }

  async countPublic(productId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(productReviews)
      .where(publicProductReviewWhere(productId));
    return row?.count ?? 0;
  }

  async findById(id: string): Promise<ProductReview | null> {
    const [row] = await this.db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, id))
      .limit(1);
    if (!row) return null;
    return rowToProductReview(row, await this.findRepliesByReviewId(id));
  }

  async create(input: CreateProductReviewInput): Promise<ProductReview> {
    const [row] = await this.db
      .insert(productReviews)
      .values({
        productId: input.productId,
        customerId: input.customerId,
        customerEmail: input.customerEmail,
        rating: input.rating ?? null,
        commentText: input.commentText,
        source: input.source,
      })
      .returning();
    if (!row) throw new ExternalServiceError('Database', 'Failed to create product review');
    return rowToProductReview(row);
  }

  async classifyWithReply(
    id: string,
    input: ClassifyProductReviewInput,
    reply?: CreateProductReviewReplyInput,
  ): Promise<ProductReview | null> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(productReviews)
        .set({
          category: input.category,
          severity: input.severity,
          sentiment: input.sentiment,
          topics: input.topics,
          suggestedResponse: input.suggestedResponse,
          classificationRaw: input.classificationRaw,
          classifiedAt: input.classifiedAt,
          status: input.status,
        })
        .where(eq(productReviews.id, id))
        .returning();
      if (!row) return null;

      if (reply) {
        await tx
          .insert(productReviewReplies)
          .values({
            reviewId: id,
            authorType: reply.authorType,
            authorName: reply.authorName ?? null,
            customerId: reply.customerId ?? null,
            replyText: reply.replyText,
          })
          .returning();
      }

      const replyRows = await tx
        .select()
        .from(productReviewReplies)
        .where(eq(productReviewReplies.reviewId, id));
      return rowToProductReview(row, replyRows.map(rowToReply));
    });
  }

  async updateStatus(
    id: string,
    status: ReviewStatus,
  ): Promise<ProductReview | null> {
    const [row] = await this.db
      .update(productReviews)
      .set({ status })
      .where(eq(productReviews.id, id))
      .returning();
    if (!row) return null;
    return rowToProductReview(row, await this.findRepliesByReviewId(id));
  }

  async createReply(
    reviewId: string,
    input: CreateProductReviewReplyInput,
  ): Promise<ProductReviewReply> {
    const [row] = await this.db
      .insert(productReviewReplies)
      .values({
        reviewId,
        authorType: input.authorType,
        authorName: input.authorName ?? null,
        customerId: input.customerId ?? null,
        replyText: input.replyText,
      })
      .returning();
    if (!row) throw new ExternalServiceError('Database', 'Failed to create product review reply');
    return rowToReply(row);
  }
}
