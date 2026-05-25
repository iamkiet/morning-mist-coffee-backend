import { ConflictError } from '../../lib/errors.js';
import type {
  CreateOrderInput,
  Order,
} from '../../domain/order/order.entity.js';
import type { OrderRepo } from '../../domain/order/order.repo.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import type { EmailSender } from '../../domain/ports/email-sender.port.js';
import { normalizeEmail } from '../../domain/user/user.entity.js';

export interface Logger {
  warn(obj: Record<string, unknown>, msg: string): void;
}

export class CreateOrderUseCase {
  constructor(
    private readonly repo: OrderRepo,
    private readonly stock: ProductStockRepo,
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const stockItems = input.items
      .filter((item) => item.productId != null)
      .map((item) => ({ productId: item.productId as string, qty: item.quantity }));

    if (stockItems.length > 0) {
      const ok = await this.stock.tryDecreaseBatch(stockItems);
      if (!ok) throw new ConflictError('One or more items are out of stock');
    }

    const totalCents = input.items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    const order = await this.repo.create({
      ...input,
      totalCents,
      email: normalizeEmail(input.email),
    });

    try {
      await this.emailSender.sendOrderConfirmation({
        to: order.email,
        orderId: order.id,
        totalCents: order.totalCents,
        currency: order.currency,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          priceCents: item.priceCents,
        })),
        createdAt: order.createdAt,
      });
    } catch (err) {
      this.logger.warn({ err }, 'Failed to send order confirmation email');
    }

    return order;
  }
}
