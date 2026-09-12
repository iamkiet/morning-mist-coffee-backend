import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { OrderReviewController } from '../controllers/order-review.controller.ts';
import {
  CreateOrderReviewBody,
  ListOrderReviewsQuery,
  ListPublicOrderReviewsQuery,
  OrderReviewIdParam,
  OrderReviewListResponse,
  OrderReviewSchema,
  ProductIdParam,
  PublicOrderReviewListResponse,
  UpdateOrderReviewStatusBody,
} from '../schemas/order-review.schema.ts';

export async function orderReviewRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new OrderReviewController(app.useCases.orderReview);

  fastify.get('/', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['order-reviews'],
      querystring: ListOrderReviewsQuery,
      response: { 200: OrderReviewListResponse },
    },
    handler: controller.list,
  });

  fastify.get('/product/:productId', {
    schema: {
      tags: ['order-reviews'],
      params: ProductIdParam,
      querystring: ListPublicOrderReviewsQuery,
      response: { 200: PublicOrderReviewListResponse },
    },
    handler: controller.listPublic,
  });

  fastify.get('/:id', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['order-reviews'],
      params: OrderReviewIdParam,
      response: { 200: OrderReviewSchema },
    },
    handler: controller.getById,
  });

  fastify.post('/', {
    schema: {
      tags: ['order-reviews'],
      body: CreateOrderReviewBody,
      response: { 201: OrderReviewSchema },
    },
    handler: controller.create,
  });

  fastify.patch('/:id/status', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['order-reviews'],
      params: OrderReviewIdParam,
      body: UpdateOrderReviewStatusBody,
      response: { 200: OrderReviewSchema },
    },
    handler: controller.updateStatus,
  });
}
