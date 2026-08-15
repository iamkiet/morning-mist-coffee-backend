import { and, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import type { Order, OrderItem } from '../../domain/order/order.entity.ts';
import type { OrderFilterCriteria } from '../../domain/order/order.repo.ts';
import { orders, type OrderItemRow, type OrderRow } from '../db/schema.ts';
import { containsPattern, prefixPattern } from './ilike-pattern.ts';

export function buildOrderFilters(filter: OrderFilterCriteria): SQL[] {
  const filters: SQL[] = [];
  if (filter.customerEmail)
    filters.push(eq(orders.customerEmail, filter.customerEmail));
  if (filter.q) {
    const pattern = containsPattern(filter.q);
    const match = or(
      ilike(orders.customerEmail, pattern),
      sql`${orders.id}::text ilike ${prefixPattern(filter.q)}`,
      sql`${orders.status}::text ilike ${pattern}`,
    );
    if (match) filters.push(match);
  }
  if (filter.status) filters.push(eq(orders.status, filter.status));
  if (filter.currency) filters.push(eq(orders.currency, filter.currency));
  if (filter.totalMin !== undefined)
    filters.push(gte(orders.totalCents, filter.totalMin));
  if (filter.totalMax !== undefined)
    filters.push(lte(orders.totalCents, filter.totalMax));
  return filters;
}

export function orderWhere(filter: OrderFilterCriteria): SQL | undefined {
  const filters = buildOrderFilters(filter);
  return filters.length ? and(...filters) : undefined;
}

export function rowToItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productVariantId: row.productVariantId,
    productName: row.productName,
    variantSku: row.variantSku,
    variantPropertyValues: row.variantPropertyValues ?? [],
    priceCents: row.priceCents,
    quantity: row.quantity,
  };
}

export function rowToOrder(row: OrderRow, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    customerEmail: row.customerEmail,
    status: row.status,
    totalCents: row.totalCents,
    currency: row.currency,
    cashReceivedCents: row.cashReceivedCents,
    changeCents: row.changeCents,
    shippingFirstName: row.shippingFirstName,
    shippingLastName: row.shippingLastName,
    shippingAddress: row.shippingAddress,
    shippingCity: row.shippingCity,
    shippingPostalCode: row.shippingPostalCode,
    items,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function groupItemsByOrder(rows: OrderItemRow[]): Map<string, OrderItem[]> {
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of rows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(rowToItem(item));
    itemsByOrder.set(item.orderId, list);
  }
  return itemsByOrder;
}
