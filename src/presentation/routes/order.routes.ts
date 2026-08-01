import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '../../config/env.js';
import { OrderController } from '../controllers/order.controller.js';
import {
  CreateOrderBody,
  ListOrdersQuery,
  LookupOrdersQuery,
  OrderIdParam,
  OrderListResponse,
  OrderLookupResponse,
  OrderSchema,
  UpdateOrderStatusBody,
} from '../schemas/order.schema.js';

const orderLookupRateLimit = {
  rateLimit: {
    max: env.ORDER_LOOKUP_RATE_MAX,
    timeWindow: env.ORDER_LOOKUP_RATE_WINDOW,
    keyGenerator: (req: FastifyRequest) => {
      const email = (req.query as { email?: string } | undefined)?.email ?? '';
      return `${req.ip}:${email.toLowerCase()}`;
    },
  },
};

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new OrderController(app.useCases.order);

  fastify.get('/', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['orders'],
      querystring: ListOrdersQuery,
      response: { 200: OrderListResponse },
    },
    handler: controller.list,
  });

  fastify.get('/lookup', {
    config: orderLookupRateLimit,
    schema: {
      tags: ['orders'],
      querystring: LookupOrdersQuery,
      response: { 200: OrderLookupResponse },
    },
    handler: controller.lookup,
  });

  fastify.get('/:id', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['orders'],
      params: OrderIdParam,
      response: { 200: OrderSchema },
    },
    handler: controller.getById,
  });

  fastify.post('/', {
    schema: {
      tags: ['orders'],
      body: CreateOrderBody,
      response: { 201: OrderSchema },
    },
    handler: controller.create,
  });

  fastify.patch('/:id/status', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['orders'],
      params: OrderIdParam,
      body: UpdateOrderStatusBody,
      response: { 200: OrderSchema },
    },
    handler: controller.updateStatus,
  });
}
