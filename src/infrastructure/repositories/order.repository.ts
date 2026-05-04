import { and, asc, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import type {
  CreateOrderInput,
  ListOrdersFilter,
  Order,
  OrderSortField,
  OrderStatus,
} from '../../domain/order/order.entity.js';
import type {
  OrderFilterCriteria,
  OrderRepo,
} from '../../domain/order/order.repo.js';
import type { DB } from '../db/client.js';
import { orders, type OrderRow } from '../db/schema.js';

const SORT_COLUMNS = {
  createdAt: orders.createdAt,
  totalCents: orders.totalCents,
} as const satisfies Record<OrderSortField, unknown>;

function buildFilters(filter: OrderFilterCriteria): SQL[] {
  const filters: SQL[] = [];
  if (filter.email) filters.push(eq(orders.email, filter.email));
  if (filter.status) filters.push(eq(orders.status, filter.status));
  if (filter.currency) filters.push(eq(orders.currency, filter.currency));
  if (filter.totalMin !== undefined)
    filters.push(gte(orders.totalCents, filter.totalMin));
  if (filter.totalMax !== undefined)
    filters.push(lte(orders.totalCents, filter.totalMax));
  return filters;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    totalCents: row.totalCents,
    currency: row.currency,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresOrderRepository implements OrderRepo {
  constructor(private readonly db: DB) {}

  async list(filter: ListOrdersFilter): Promise<Order[]> {
    const filters = buildFilters(filter);
    const orderFn = filter.sortDir === 'asc' ? asc : desc;
    const sortColumn = SORT_COLUMNS[filter.sortBy];

    const rows = await this.db
      .select()
      .from(orders)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(orderFn(sortColumn), desc(orders.id))
      .limit(filter.limit)
      .offset(filter.offset);

    return rows.map(rowToOrder);
  }

  async count(filter: OrderFilterCriteria): Promise<number> {
    const filters = buildFilters(filter);

    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(filters.length ? and(...filters) : undefined);
    return row?.count ?? 0;
  }

  async findById(id: string): Promise<Order | null> {
    const [row] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return row ? rowToOrder(row) : null;
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const [row] = await this.db
      .insert(orders)
      .values({
        email: input.email,
        totalCents: input.totalCents,
        currency: input.currency,
      })
      .returning();
    if (!row) throw new Error('Failed to create order');
    return rowToOrder(row);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const [row] = await this.db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return row ? rowToOrder(row) : null;
  }
}
