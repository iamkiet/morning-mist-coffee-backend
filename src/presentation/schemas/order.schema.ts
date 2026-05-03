import { z } from 'zod';
import {
  paginatedResponse,
  paginationFields,
  sortFields,
} from './_pagination.js';
import { CurrencySchema } from './product.schema.js';

export const OrderStatus = z.enum([
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
]);

export const OrderSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  status: OrderStatus,
  totalCents: z.number().int().min(0),
  currency: CurrencySchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateOrderBody = z.object({
  customerId: z.uuid(),
  totalCents: z.number().int().min(0),
  currency: CurrencySchema,
});

export const UpdateOrderStatusBody = z.object({
  status: OrderStatus,
});

export const OrderIdParam = z.object({
  id: z.uuid(),
});

export const ListOrdersQuery = z.object({
  customerId: z.uuid().optional(),
  status: OrderStatus.optional(),
  currency: CurrencySchema.optional(),
  totalMin: z.coerce.number().int().min(0).optional(),
  totalMax: z.coerce.number().int().min(0).optional(),
  ...sortFields(['createdAt', 'totalCents']),
  ...paginationFields,
});

export const OrderListResponse = paginatedResponse(OrderSchema);

export type OrderDTO = z.infer<typeof OrderSchema>;
