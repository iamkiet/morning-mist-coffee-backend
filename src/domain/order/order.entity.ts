import type { Currency } from '../shared/currency.ts';
import type { SortDirection } from '../shared/pagination.ts';

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  id: string;
  productVariantId: string | null;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface CreateOrderItemInput {
  productVariantId?: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  email: string;
  status: OrderStatus;
  totalCents: number;
  currency: Currency;
  cashReceivedCents: number | null;
  changeCents: number | null;
  shippingFirstName: string | null;
  shippingLastName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  email: string;
  totalCents: number;
  currency: Currency;
  cashReceivedCents?: number;
  changeCents?: number;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export type OrderSortField = 'createdAt' | 'totalCents';

export interface ListOrdersFilter {
  email?: string;
  q?: string;
  status?: OrderStatus;
  currency?: Currency;
  totalMin?: number;
  totalMax?: number;
  sortBy: OrderSortField;
  sortDir: SortDirection;
  limit: number;
  offset: number;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
