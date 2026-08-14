import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  CreateOrderInput,
  ListOrdersFilter,
  Order,
  OrderSortField,
  OrderStatus,
} from '../../domain/order/order.entity.ts';
import type {
  OrderFilterCriteria,
  OrderRepo,
} from '../../domain/order/order.repo.ts';
import type { DB } from '../db/client.ts';
import { orderItems, orders } from '../db/schema.ts';
import {
  groupItemsByOrder,
  orderWhere,
  rowToItem,
  rowToOrder,
} from './order.mappers.ts';

const SORT_COLUMNS = {
  createdAt: orders.createdAt,
  totalCents: orders.totalCents,
} as const satisfies Record<OrderSortField, unknown>;

export class PostgresOrderRepository implements OrderRepo {
  constructor(private readonly db: DB) {}

  async list(filter: ListOrdersFilter): Promise<Order[]> {
    const orderFn = filter.sortDir === 'asc' ? asc : desc;
    const sortColumn = SORT_COLUMNS[filter.sortBy];

    const rows = await this.db
      .select()
      .from(orders)
      .where(orderWhere(filter))
      .orderBy(orderFn(sortColumn), desc(orders.id))
      .limit(filter.limit)
      .offset(filter.offset);

    if (rows.length === 0) return [];

    const itemRows = await this.db
      .select()
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          rows.map((r) => r.id),
        ),
      );

    const itemsByOrder = groupItemsByOrder(itemRows);
    return rows.map((r) => rowToOrder(r, itemsByOrder.get(r.id) ?? []));
  }

  async count(filter: OrderFilterCriteria): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(orderWhere(filter));
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
        cashReceivedCents: input.cashReceivedCents ?? null,
        changeCents: input.changeCents ?? null,
        shippingFirstName: input.shippingFirstName,
        shippingLastName: input.shippingLastName,
        shippingAddress: input.shippingAddress,
        shippingCity: input.shippingCity,
        shippingPostalCode: input.shippingPostalCode,
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
                productVariantId: item.productVariantId ?? null,
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
