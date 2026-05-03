import type { Currency } from '../shared/currency.js';
import type { SortDirection } from '../shared/pagination.js';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalCents: number;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  customerId: string;
  totalCents: number;
  currency: Currency;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export type OrderSortField = 'createdAt' | 'totalCents';

export interface ListOrdersFilter {
  customerId?: string;
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
