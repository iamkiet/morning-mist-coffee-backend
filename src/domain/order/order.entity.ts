import type { Currency } from '../shared/currency.js';
import type { SortDirection } from '../shared/pagination.js';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string | null;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface CreateOrderItemInput {
  productId?: string;
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
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  email: string;
  totalCents: number;
  currency: Currency;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export type OrderSortField = 'createdAt' | 'totalCents';

export interface ListOrdersFilter {
  email?: string;
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
