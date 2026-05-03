import type {
  CreateOrderInput,
  ListOrdersFilter,
  Order,
  OrderStatus,
} from './order.entity.js';

export type OrderFilterCriteria = Omit<
  ListOrdersFilter,
  'sortBy' | 'sortDir' | 'limit' | 'offset'
>;

export interface OrderRepo {
  list(filter: ListOrdersFilter): Promise<Order[]>;
  count(filter: OrderFilterCriteria): Promise<number>;
  findById(id: string): Promise<Order | null>;
  create(input: CreateOrderInput): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}
