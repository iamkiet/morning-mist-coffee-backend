import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ProductReviewController } from '../controllers/product-review.controller.ts';
import {
  CreateProductReviewBody,
  CreateProductReviewReplyBody,
  ListProductReviewsQuery,
  ListPublicProductReviewsQuery,
  ProductReviewIdParam,
  ProductReviewListResponse,
  ProductReviewReplyParams,
  ProductReviewReplySchema,
  ProductReviewSchema,
  ProductIdParam,
  PublicProductReviewListResponse,
  UpdateProductReviewStatusBody,
} from '../schemas/product-review.schema.ts';

export async function productReviewRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ProductReviewController(app.useCases.productReview);

  fastify.get('/', {
    onRequest: [app.authenticate, app.requireRole(['admin', 'staff'])],
    schema: {
      tags: ['product-reviews'],
      querystring: ListProductReviewsQuery,
      response: { 200: ProductReviewListResponse },
    },
    handler: controller.list,
  });

  fastify.get('/product/:productId', {
    schema: {
      tags: ['product-reviews'],
      params: ProductIdParam,
      querystring: ListPublicProductReviewsQuery,
      response: { 200: PublicProductReviewListResponse },
    },
    handler: controller.listPublic,
  });

  fastify.get('/:id', {
    onRequest: [app.authenticate, app.requireRole(['admin', 'staff'])],
    schema: {
      tags: ['product-reviews'],
      params: ProductReviewIdParam,
      response: { 200: ProductReviewSchema },
    },
    handler: controller.getById,
  });

  fastify.post('/', {
    onRequest: [app.authenticate, app.requireRole('customer')],
    schema: {
      tags: ['product-reviews'],
      body: CreateProductReviewBody,
      response: { 201: ProductReviewSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.create,
  });

  fastify.post('/:reviewId/replies', {
    onRequest: [app.authenticate, app.requireRole('customer')],
    schema: {
      tags: ['product-reviews'],
      params: ProductReviewReplyParams,
      body: CreateProductReviewReplyBody,
      response: { 201: ProductReviewReplySchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.createReply,
  });

  fastify.post('/:reviewId/admin-replies', {
    onRequest: [app.authenticate, app.requireRole(['admin', 'staff'])],
    schema: {
      tags: ['product-reviews'],
      params: ProductReviewReplyParams,
      body: CreateProductReviewReplyBody,
      response: { 201: ProductReviewReplySchema },
    },
    handler: controller.createAdminReply,
  });

  fastify.patch('/:id/status', {
    onRequest: [app.authenticate, app.requireRole(['admin', 'staff'])],
    schema: {
      tags: ['product-reviews'],
      params: ProductReviewIdParam,
      body: UpdateProductReviewStatusBody,
      response: { 200: ProductReviewSchema },
    },
    handler: controller.updateStatus,
  });
}
