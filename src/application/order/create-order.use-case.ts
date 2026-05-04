import type {
  CreateOrderInput,
  Order,
} from '../../domain/order/order.entity.js';
import type { OrderRepo } from '../../domain/order/order.repo.js';
import { normalizeEmail } from '../../domain/user/user.entity.js';

export class CreateOrderUseCase {
  constructor(private readonly repo: OrderRepo) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    return this.repo.create({ ...input, email: normalizeEmail(input.email) });
  }
}
