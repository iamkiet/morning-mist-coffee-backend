import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  ClassifyOrderReviewInput,
  CreateOrderReviewInput,
  CreateOrderReviewReplyInput,
  ListOrderReviewsFilter,
  OrderReview,
  OrderReviewReply,
  OrderReviewSortField,
  ReviewStatus,
} from '../../domain/order-review/order-review.entity.ts';
import type {
  OrderReviewFilterCriteria,
  OrderReviewRepo,
} from '../../domain/order-review/order-review.repo.ts';
import type { DB } from '../db/client.ts';
import { orderReviewReplies, orderReviews } from '../db/schema.ts';
import {
  groupRepliesByReview,
  orderReviewWhere,
  publicOrderReviewWhere,
  rowToOrderReview,
  rowToReply,
} from './order-review.mappers.ts';

const SORT_COLUMNS = {
  createdAt: orderReviews.createdAt,
} as const satisfies Record<OrderReviewSortField, unknown>;

export class PostgresOrderReviewRepository implements OrderReviewRepo {
  constructor(private readonly db: DB) {}

  private async findRepliesByReviewId(id: string): Promise<OrderReviewReply[]> {
    const rows = await this.db
      .select()
      .from(orderReviewReplies)
      .where(eq(orderReviewReplies.reviewId, id));
    return rows.map(rowToReply);
  }

  async list(filter: ListOrderReviewsFilter): Promise<OrderReview[]> {
    const orderFn = filter.sortDir === 'asc' ? asc : desc;
    const sortColumn = SORT_COLUMNS[filter.sortBy];

    const rows = await this.db
      .select()
      .from(orderReviews)
      .where(orderReviewWhere(filter))
      .orderBy(orderFn(sortColumn), desc(orderReviews.id))
      .limit(filter.limit)
      .offset(filter.offset);

    if (rows.length === 0) return [];

    const replyRows = await this.db
      .select()
      .from(orderReviewReplies)
      .where(
        inArray(
          orderReviewReplies.reviewId,
          rows.map((r) => r.id),
        ),
      );

    const repliesByReview = groupRepliesByReview(replyRows);
    return rows.map((r) => rowToOrderReview(r, repliesByReview.get(r.id) ?? []));
  }

  async count(filter: OrderReviewFilterCriteria): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orderReviews)
      .where(orderReviewWhere(filter));
    return row?.count ?? 0;
  }

  async listPublic(
    productId: string,
    limit: number,
    offset: number,
  ): Promise<OrderReview[]> {
    const rows = await this.db
      .select()
      .from(orderReviews)
      .where(publicOrderReviewWhere(productId))
      .orderBy(desc(orderReviews.createdAt), desc(orderReviews.id))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) return [];

    const replyRows = await this.db
      .select()
      .from(orderReviewReplies)
      .where(
        inArray(
          orderReviewReplies.reviewId,
          rows.map((r) => r.id),
        ),
      );

    const repliesByReview = groupRepliesByReview(replyRows);
    return rows.map((r) => rowToOrderReview(r, repliesByReview.get(r.id) ?? []));
  }

  async countPublic(productId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orderReviews)
      .where(publicOrderReviewWhere(productId));
    return row?.count ?? 0;
  }

  async findById(id: string): Promise<OrderReview | null> {
    const [row] = await this.db
      .select()
      .from(orderReviews)
      .where(eq(orderReviews.id, id))
      .limit(1);
    if (!row) return null;
    return rowToOrderReview(row, await this.findRepliesByReviewId(id));
  }

  async create(input: CreateOrderReviewInput): Promise<OrderReview> {
    const [row] = await this.db
      .insert(orderReviews)
      .values({
        productId: input.productId ?? null,
        orderId: input.orderId ?? null,
        customerEmail: input.customerEmail ?? null,
        rating: input.rating ?? null,
        commentText: input.commentText,
        source: input.source,
      })
      .returning();
    if (!row) throw new Error('Failed to create order review');
    return rowToOrderReview(row);
  }

  async classify(
    id: string,
    input: ClassifyOrderReviewInput,
  ): Promise<OrderReview | null> {
    const [row] = await this.db
      .update(orderReviews)
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
      .where(eq(orderReviews.id, id))
      .returning();
    if (!row) return null;
    return rowToOrderReview(row, await this.findRepliesByReviewId(id));
  }

  async updateStatus(
    id: string,
    status: ReviewStatus,
  ): Promise<OrderReview | null> {
    const [row] = await this.db
      .update(orderReviews)
      .set({ status })
      .where(eq(orderReviews.id, id))
      .returning();
    if (!row) return null;
    return rowToOrderReview(row, await this.findRepliesByReviewId(id));
  }

  async createReply(
    reviewId: string,
    input: CreateOrderReviewReplyInput,
  ): Promise<OrderReviewReply> {
    const [row] = await this.db
      .insert(orderReviewReplies)
      .values({
        reviewId,
        authorType: input.authorType,
        authorName: input.authorName ?? null,
        replyText: input.replyText,
      })
      .returning();
    if (!row) throw new Error('Failed to create order review reply');
    return rowToReply(row);
  }
}
