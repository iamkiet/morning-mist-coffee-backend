import type { Order } from '../../domain/order/order.entity.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';
import { normalizeEmail } from '../../domain/user/user.entity.ts';

export interface LookupOrderInput {
  email: string;
  code: string;
}

export class LookupOrderUseCase {
  constructor(private readonly orders: OrderRepo) {}

  async execute(input: LookupOrderInput): Promise<Order | null> {
    const [order] = await this.orders.list({
      email: normalizeEmail(input.email),
      idPrefix: input.code.toLowerCase(),
      sortBy: 'createdAt',
      sortDir: 'desc',
      limit: 1,
      offset: 0,
    });
    return order ?? null;
  }
}
