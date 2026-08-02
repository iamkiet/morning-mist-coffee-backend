import { NotFoundError } from '../../lib/errors.ts';
import type { Order } from '../../domain/order/order.entity.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';

export class GetOrderByIdUseCase {
  constructor(private readonly repo: OrderRepo) {}

  async execute(id: string): Promise<Order> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundError('Order', id);
    return order;
  }
}
