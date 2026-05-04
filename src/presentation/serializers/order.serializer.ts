import type { Order } from '../../domain/order/order.entity.js';
import {
  mapPaginated,
  type Paginated,
} from '../../domain/shared/pagination.js';
import type { OrderDTO } from '../schemas/order.schema.js';

export function toOrderDTO(order: Order): OrderDTO {
  return {
    id: order.id,
    email: order.email,
    status: order.status,
    totalCents: order.totalCents,
    currency: order.currency,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
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
