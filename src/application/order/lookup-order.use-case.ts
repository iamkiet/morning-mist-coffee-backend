import type { Order } from '../../domain/order/order.entity.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';

export interface LookupOrderInput {
  code: string;
}

export class LookupOrderUseCase {
  constructor(private readonly orders: OrderRepo) {}

  async execute(input: LookupOrderInput): Promise<Order | null> {
    return this.orders.findById(input.code);
  }
}
