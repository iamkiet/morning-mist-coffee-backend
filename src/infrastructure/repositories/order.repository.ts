import { and, asc, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import type {
  CreateOrderInput,
  ListOrdersFilter,
  Order,
  OrderItem,
  OrderSortField,
  OrderStatus,
} from '../../domain/order/order.entity.js';
import type {
  OrderFilterCriteria,
  OrderRepo,
} from '../../domain/order/order.repo.js';
import type { DB } from '../db/client.js';
import {
  orderItems,
  orders,
  type OrderItemRow,
  type OrderRow,
} from '../db/schema.js';

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

function rowToItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.productId,
    name: row.name,
    priceCents: row.priceCents,
    quantity: row.quantity,
  };
}

function rowToOrder(row: OrderRow, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    totalCents: row.totalCents,
    currency: row.currency,
    items,
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

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const itemRows = await this.db
      .select()
      .from(orderItems)
      .where(sql`${orderItems.orderId} = ANY(${sql.raw(`ARRAY[${ids.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(rowToItem(item));
      itemsByOrder.set(item.orderId, list);
    }

    return rows.map((r) => rowToOrder(r, itemsByOrder.get(r.id) ?? []));
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
    if (!row) return null;

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    return rowToOrder(row, items.map(rowToItem));
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

    const items =
      input.items.length > 0
        ? await this.db
            .insert(orderItems)
            .values(
              input.items.map((item) => ({
                orderId: row.id,
                productId: item.productId ?? null,
                name: item.name,
                priceCents: item.priceCents,
                quantity: item.quantity,
              })),
            )
            .returning()
        : [];

    return rowToOrder(row, items.map(rowToItem));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const [row] = await this.db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    if (!row) return null;

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    return rowToOrder(row, items.map(rowToItem));
  }
}
