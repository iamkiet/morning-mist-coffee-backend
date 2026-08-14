import type { Order } from '../../domain/order/order.entity.ts';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.ts';
import type { OrderDTO } from '../schemas/order.schema.ts';

export function toOrderDTO(order: Order): OrderDTO {
  return {
    id: order.id,
    email: order.email,
    status: order.status,
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
      id: item.id,
      productVariantId: item.productVariantId,
      name: item.name,
      priceCents: item.priceCents,
      quantity: item.quantity,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toOrderListPayload(
  result: Paginated<Order>,
): Paginated<OrderDTO> {
  return mapPaginated(result, toOrderDTO);
}
