import { asc, desc, eq, sql } from 'drizzle-orm';
import type {
  ClassifyOrderReviewInput,
  CreateOrderReviewInput,
  ListOrderReviewsFilter,
  OrderReview,
  OrderReviewSortField,
  ReviewStatus,
} from '../../domain/order-review/order-review.entity.ts';
import type {
  OrderReviewFilterCriteria,
  OrderReviewRepo,
} from '../../domain/order-review/order-review.repo.ts';
import type { DB } from '../db/client.ts';
import { orderReviews } from '../db/schema.ts';
import { orderReviewWhere, rowToOrderReview } from './order-review.mappers.ts';

const SORT_COLUMNS = {
  createdAt: orderReviews.createdAt,
} as const satisfies Record<OrderReviewSortField, unknown>;

export class PostgresOrderReviewRepository implements OrderReviewRepo {
  constructor(private readonly db: DB) {}

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

    return rows.map(rowToOrderReview);
  }

  async count(filter: OrderReviewFilterCriteria): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orderReviews)
      .where(orderReviewWhere(filter));
    return row?.count ?? 0;
  }

  async findById(id: string): Promise<OrderReview | null> {
    const [row] = await this.db
      .select()
      .from(orderReviews)
      .where(eq(orderReviews.id, id))
      .limit(1);
    return row ? rowToOrderReview(row) : null;
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
    return row ? rowToOrderReview(row) : null;
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
    return row ? rowToOrderReview(row) : null;
  }
}
