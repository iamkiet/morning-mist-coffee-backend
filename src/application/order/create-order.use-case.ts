import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import type {
  CreateOrderInput,
  Order,
} from '../../domain/order/order.entity.js';
import type { OrderRepo } from '../../domain/order/order.repo.js';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';
import type { EmailSender } from '../../domain/ports/email-sender.port.js';
import { normalizeEmail } from '../../domain/user/user.entity.js';

export interface Logger {
  warn(obj: Record<string, unknown>, msg: string): void;
}

export class CreateOrderUseCase {
  constructor(
    private readonly repo: OrderRepo,
    private readonly products: ProductRepo,
    private readonly stock: ProductStockRepo,
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const resolvedItems = [];
    for (const item of input.items) {
      if (!item.productId) {
        throw new ValidationError('Each order item must specify a product ID');
      }
      const product = await this.products.findById(item.productId);
      if (!product) {
        throw new NotFoundError('Product', item.productId);
      }
      if (product.currency !== input.currency) {
        throw new ValidationError(`Product currency ${product.currency} does not match order currency ${input.currency}`);
      }
      resolvedItems.push({
        productId: item.productId,
        name: product.name,
        priceCents: product.priceCents,
        quantity: item.quantity,
      });
    }

    const stockItems = resolvedItems
      .map((item) => ({ productId: item.productId, qty: item.quantity }));

    if (stockItems.length > 0) {
      const ok = await this.stock.tryDecreaseBatch(stockItems);
      if (!ok) throw new ConflictError('One or more items are out of stock');
    }

    const totalCents = resolvedItems.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    const order = await this.repo.create({
      ...input,
      items: resolvedItems,
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
