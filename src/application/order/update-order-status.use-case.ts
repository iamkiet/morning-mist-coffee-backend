import { ConflictError, NotFoundError } from '../../lib/errors.ts';
import {
  canTransition,
  type Order,
  type UpdateOrderStatusInput,
} from '../../domain/order/order.entity.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';

export class UpdateOrderStatusUseCase {
  constructor(private readonly repo: OrderRepo) {}

  async execute(id: string, input: UpdateOrderStatusInput): Promise<Order> {
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Order', id);

    if (!canTransition(current.status, input.status)) {
      throw new ConflictError(
        `Cannot transition order from '${current.status}' to '${input.status}'`,
      );
    }

    const updated = await this.repo.updateStatus(id, input.status);
    if (!updated) throw new NotFoundError('Order', id);
    return updated;
  }
}
