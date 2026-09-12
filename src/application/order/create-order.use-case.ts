import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.ts';
import type {
  CreateOrderInput,
  Order,
} from '../../domain/order/order.entity.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { EmailSender } from '../../domain/ports/email-sender.port.ts';
import { normalizeEmail } from '../../domain/shared/email.ts';

export interface Logger {
  warn(obj: Record<string, unknown>, msg: string): void;
}

function computeCashChange(
  cashReceivedCents: number | undefined,
  totalCents: number,
): { cashReceivedCents: number; changeCents: number } | undefined {
  if (cashReceivedCents === undefined || cashReceivedCents === null) return undefined;
  if (cashReceivedCents < totalCents) {
    throw new ValidationError(
      `Cash received (${cashReceivedCents}) must be greater than or equal to total amount (${totalCents})`,
    );
  }
  return { cashReceivedCents, changeCents: cashReceivedCents - totalCents };
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
    const items = input.items.map((item) => {
      if (!item.productVariantId) {
        throw new ValidationError('Each order item must specify a product variant ID');
      }
      return { productVariantId: item.productVariantId, quantity: item.quantity };
    });
    const variantIds = items.map((item) => item.productVariantId);

    const variants = await this.variants.findByIds(variantIds);
    const variantById = new Map(variants.map((v) => [v.id, v]));

    const productIds = [...new Set(variants.map((v) => v.productId))];
    const products = await this.products.findByIds(productIds);
    const productById = new Map(products.map((p) => [p.id, p]));

    const propertyValuesByVariant = await this.variants.getPropertyValuesByVariantIds(variantIds);

    const resolvedItems = items.map((item) => {
      const variant = variantById.get(item.productVariantId);
      if (!variant) throw new NotFoundError('ProductVariant', item.productVariantId);
      const product = productById.get(variant.productId);
      if (!product) throw new NotFoundError('Product', variant.productId);
      if (variant.currency !== input.currency) {
        throw new ValidationError(`Variant currency ${variant.currency} does not match order currency ${input.currency}`);
      }
      const propertyValues = propertyValuesByVariant.get(variant.id) ?? [];
      return {
        productVariantId: variant.id,
        productName: product.name,
        variantSku: variant.sku,
        variantPropertyValues: propertyValues.map((p) => ({
          propertyName: p.propertyName,
          value: p.value,
        })),
        priceCents: variant.priceCents,
        quantity: item.quantity,
      };
    });

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

    const cashChange = computeCashChange(input.cashReceivedCents, totalCents);

    let order;
    try {
      order = await this.repo.create({
        ...input,
        items: resolvedItems,
        totalCents,
        cashReceivedCents: cashChange?.cashReceivedCents,
        changeCents: cashChange?.changeCents,
        customerEmail: normalizeEmail(input.customerEmail),
      });
    } catch (err) {
      if (stockItems.length > 0) {
        await Promise.all(
          stockItems.map((item) => this.variants.increaseStock(item.variantId, item.qty)),
        );
      }
      throw err;
    }

    try {
      await this.emailSender.sendOrderConfirmation({
        to: order.customerEmail,
        orderId: order.id,
        totalCents: order.totalCents,
        currency: order.currency,
        cashReceivedCents: order.cashReceivedCents,
        changeCents: order.changeCents,
        shippingFullName: order.shippingFullName,
        shippingAddress: order.shippingAddress,
        items: order.items.map((item) => ({
          productName: item.productName,
          variantSku: item.variantSku,
          variantPropertyValues: item.variantPropertyValues,
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
