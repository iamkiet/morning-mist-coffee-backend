import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.ts';
import type {
  CreateOrderInput,
  Order,
} from '../../domain/order/order.entity.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { EmailSender } from '../../domain/ports/email-sender.port.ts';
import { normalizeEmail } from '../../domain/user/user.entity.ts';

export interface Logger {
  warn(obj: Record<string, unknown>, msg: string): void;
}

export class CreateOrderUseCase {
  constructor(
    private readonly repo: OrderRepo,
    private readonly products: ProductRepo,
    private readonly variants: ProductVariantRepo,
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const resolvedItems = [];
    for (const item of input.items) {
      if (!item.productVariantId) {
        throw new ValidationError('Each order item must specify a product variant ID');
      }
      const variant = await this.variants.findById(item.productVariantId);
      if (!variant) {
        throw new NotFoundError('ProductVariant', item.productVariantId);
      }
      const product = await this.products.findById(variant.productId);
      if (!product) {
        throw new NotFoundError('Product', variant.productId);
      }
      if (variant.currency !== input.currency) {
        throw new ValidationError(`Variant currency ${variant.currency} does not match order currency ${input.currency}`);
      }
      resolvedItems.push({
        productVariantId: item.productVariantId,
        name: product.name,
        priceCents: variant.priceCents,
        quantity: item.quantity,
      });
    }

    const stockItems = resolvedItems.map((item) => ({
      variantId: item.productVariantId,
      qty: item.quantity,
    }));

    if (stockItems.length > 0) {
      const result = await this.variants.tryDecreaseStockBatch(stockItems);
      if (!result.ok) throw new ConflictError('One or more items are out of stock');
    }

    const totalCents = resolvedItems.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    let cashReceivedCents: number | undefined = undefined;
    let changeCents: number | undefined = undefined;

    if (input.cashReceivedCents !== undefined && input.cashReceivedCents !== null) {
      if (input.cashReceivedCents < totalCents) {
        throw new ValidationError(
          `Cash received (${input.cashReceivedCents}) must be greater than or equal to total amount (${totalCents})`
        );
      }
      cashReceivedCents = input.cashReceivedCents;
      changeCents = input.cashReceivedCents - totalCents;
    }

    const order = await this.repo.create({
      ...input,
      items: resolvedItems,
      totalCents,
      cashReceivedCents,
      changeCents,
      email: normalizeEmail(input.email),
    });

    try {
      await this.emailSender.sendOrderConfirmation({
        to: order.email,
        orderId: order.id,
        totalCents: order.totalCents,
        currency: order.currency,
        cashReceivedCents: order.cashReceivedCents,
        changeCents: order.changeCents,
        shippingFirstName: order.shippingFirstName,
        shippingLastName: order.shippingLastName,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingPostalCode: order.shippingPostalCode,
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
