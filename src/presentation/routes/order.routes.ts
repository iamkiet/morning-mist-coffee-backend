import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '../../config/env.ts';
import { ROLES_ADMIN_STAFF } from '../../domain/auth/auth-role.ts';
import { OrderController } from '../controllers/order.controller.ts';
import {
  CreateOrderBody,
  ListMyOrdersQuery,
  ListOrdersQuery,
  LookupOrdersQuery,
  OrderIdParam,
  OrderListResponse,
  OrderLookupResponse,
  OrderSchema,
  UpdateOrderStatusBody,
} from '../schemas/order.schema.ts';

const orderLookupRateLimit = {
  rateLimit: {
    max: env.ORDER_LOOKUP_RATE_MAX,
    timeWindow: env.ORDER_LOOKUP_RATE_WINDOW,
    keyGenerator: (req: FastifyRequest) => req.ip,
  },
};

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new OrderController(app.useCases.order);

  fastify.get('/', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['orders'],
      querystring: ListOrdersQuery,
      response: { 200: OrderListResponse },
    },
    handler: controller.list,
  });

  fastify.get('/me', {
    onRequest: [app.authenticate, app.requireRole('customer')],
    schema: {
      tags: ['orders'],
      querystring: ListMyOrdersQuery,
      response: { 200: OrderListResponse },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.listMine,
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
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['orders'],
      params: OrderIdParam,
      response: { 200: OrderSchema },
    },
    handler: controller.getById,
  });

  fastify.post('/', {
    onRequest: [app.authenticate, app.requireRole('customer')],
    schema: {
      tags: ['orders'],
      body: CreateOrderBody,
      response: { 201: OrderSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.create,
  });

  fastify.patch('/:id/status', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['orders'],
      params: OrderIdParam,
      body: UpdateOrderStatusBody,
      response: { 200: OrderSchema },
    },
    handler: controller.updateStatus,
  });
}
