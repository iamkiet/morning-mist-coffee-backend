import { ConflictError } from '../../lib/errors.js';
import type {
  CreateOrderInput,
  Order,
} from '../../domain/order/order.entity.js';
import type { OrderRepo } from '../../domain/order/order.repo.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import { normalizeEmail } from '../../domain/user/user.entity.js';

export class CreateOrderUseCase {
  constructor(
    private readonly repo: OrderRepo,
    private readonly stock: ProductStockRepo,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const stockItems = input.items
      .filter((item) => item.productId != null)
      .map((item) => ({ productId: item.productId as string, qty: item.quantity }));

    if (stockItems.length > 0) {
      const ok = await this.stock.tryDecreaseBatch(stockItems);
      if (!ok) throw new ConflictError('One or more items are out of stock');
    }

    return this.repo.create({ ...input, email: normalizeEmail(input.email) });
  }
}
