import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ProductController } from '../controllers/product.controller.js';
import {
  CreateProductBody,
  ListProductsQuery,
  ProductIdParam,
  ProductListResponse,
  ProductSchema,
  ProductStockSchema,
  StockChangeBody,
  UpdateProductBody,
} from '../schemas/product.schema.js';

export async function productRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ProductController(app.useCases.product);

  fastify.get('/', {
    schema: {
      tags: ['products'],
      querystring: ListProductsQuery,
      response: { 200: ProductListResponse },
    },
    handler: controller.list,
  });

  fastify.get('/:id', {
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      response: { 200: ProductSchema },
    },
    handler: controller.getById,
  });

  fastify.post('/', {
    onRequest: app.authenticate,
    schema: {
      tags: ['products'],
      body: CreateProductBody,
      response: { 201: ProductSchema },
    },
    handler: controller.create,
  });

  fastify.patch('/:id', {
    onRequest: app.authenticate,
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      body: UpdateProductBody,
      response: { 200: ProductSchema },
    },
    handler: controller.update,
  });

  fastify.delete('/:id', {
    onRequest: app.authenticate,
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      response: { 204: { type: 'null' } },
    },
    handler: controller.delete,
  });

  fastify.get('/:id/stock', {
    onRequest: app.authenticate,
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      response: { 200: ProductStockSchema },
    },
    handler: controller.getStock,
  });

  fastify.post('/:id/stock/increase', {
    onRequest: app.authenticate,
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      body: StockChangeBody,
      response: { 200: ProductStockSchema },
    },
    handler: controller.increaseStock,
  });

  fastify.post('/:id/stock/decrease', {
    onRequest: app.authenticate,
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      body: StockChangeBody,
      response: { 200: ProductStockSchema },
    },
    handler: controller.decreaseStock,
  });
}
