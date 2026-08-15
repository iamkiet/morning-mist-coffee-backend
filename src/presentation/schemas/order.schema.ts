import { z } from 'zod';
import { ORDER_STATUSES } from '../../domain/order/order.entity.ts';
import {
  paginatedResponse,
  paginationFields,
  sortFields,
} from './_pagination.ts';
import { CurrencySchema } from './product.schema.ts';

export const OrderStatus = z.enum(ORDER_STATUSES);

export const OrderItemPropertyValueSchema = z.object({
  propertyName: z.string(),
  value: z.string(),
});

export const OrderItemSchema = z.object({
  id: z.uuid(),
  productVariantId: z.uuid().nullable(),
  productName: z.string(),
  variantSku: z.string().nullable(),
  variantPropertyValues: z.array(OrderItemPropertyValueSchema),
  priceCents: z.number().int().min(0),
  quantity: z.number().int().min(1),
});

export const OrderSchema = z.object({
  id: z.uuid(),
  customerEmail: z.email(),
  status: OrderStatus,
  totalCents: z.number().int().min(0),
  currency: CurrencySchema,
  cashReceivedCents: z.number().int().min(0).nullable(),
  changeCents: z.number().int().min(0).nullable(),
  shippingFirstName: z.string().nullable(),
  shippingLastName: z.string().nullable(),
  shippingAddress: z.string().nullable(),
  shippingCity: z.string().nullable(),
  shippingPostalCode: z.string().nullable(),
  items: z.array(OrderItemSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateOrderItemBody = z.object({
  productVariantId: z.uuid().optional(),
  productName: z.string().min(1),
  priceCents: z.number().int().min(0),
  quantity: z.number().int().min(1),
});

export const CreateOrderBody = z.object({
  customerEmail: z.email(),
  totalCents: z.number().int().min(0),
  currency: CurrencySchema,
  cashReceivedCents: z.number().int().min(0).optional(),
  shippingFirstName: z.string().min(1).max(100),
  shippingLastName: z.string().min(1).max(100),
  shippingAddress: z.string().min(5).max(500),
  shippingCity: z.string().min(1).max(100),
  shippingPostalCode: z.string().min(3).max(20),
  items: z.array(CreateOrderItemBody).min(1),
});

export const UpdateOrderStatusBody = z.object({
  status: OrderStatus,
});

export const OrderIdParam = z.object({
  id: z.uuid(),
});

export const ListOrdersQuery = z.object({
  customerEmail: z.email().optional(),
  q: z.string().min(1).max(200).optional(),
  status: OrderStatus.optional(),
  currency: CurrencySchema.optional(),
  totalMin: z.coerce.number().int().min(0).optional(),
  totalMax: z.coerce.number().int().min(0).optional(),
  ...sortFields(['createdAt', 'totalCents']),
  ...paginationFields,
});

export const OrderListResponse = paginatedResponse(OrderSchema);

export const LookupOrdersQuery = z.object({
  code: z.uuid('Order code must be the full order ID shown on your receipt'),
});

export const OrderLookupResponse = z.object({
  items: z.array(OrderSchema),
});

export type OrderDTO = z.infer<typeof OrderSchema>;
