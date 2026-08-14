import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ProductController } from '../controllers/product.controller.ts';
import {
  CreateProductBody,
  CreateProductVariantBody,
  ListProductsQuery,
  ProductIdParam,
  ProductListResponse,
  ProductSchema,
  ProductSlugParam,
  ProductVariantIdParam,
  ProductVariantSchema,
  SetProductCategoriesBody,
  SetVariantPropertyValuesBody,
  StockChangeBody,
  UpdateProductBody,
  UpdateProductVariantBody,
} from '../schemas/product.schema.ts';

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

  fastify.get('/slug/:slug', {
    schema: {
      tags: ['products'],
      params: ProductSlugParam,
      response: { 200: ProductSchema },
    },
    handler: controller.getBySlug,
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
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      body: CreateProductBody,
      response: { 201: ProductSchema },
    },
    handler: controller.create,
  });

  fastify.patch('/:id', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      body: UpdateProductBody,
      response: { 200: ProductSchema },
    },
    handler: controller.update,
  });

  fastify.delete('/:id', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      response: { 204: z.null() },
    },
    handler: controller.delete,
  });

  fastify.put('/:id/categories', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      body: SetProductCategoriesBody,
      response: { 204: z.null() },
    },
    handler: controller.setCategories,
  });

  fastify.post('/:id/variants', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductIdParam,
      body: CreateProductVariantBody,
      response: { 201: ProductVariantSchema },
    },
    handler: controller.createVariant,
  });

  fastify.patch('/variants/:variantId', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductVariantIdParam,
      body: UpdateProductVariantBody,
      response: { 200: ProductVariantSchema },
    },
    handler: controller.updateVariant,
  });

  fastify.delete('/variants/:variantId', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductVariantIdParam,
      response: { 204: z.null() },
    },
    handler: controller.deleteVariant,
  });

  fastify.put('/variants/:variantId/properties', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductVariantIdParam,
      body: SetVariantPropertyValuesBody,
      response: { 204: z.null() },
    },
    handler: controller.setVariantPropertyValues,
  });

  fastify.get('/variants/:variantId/stock', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductVariantIdParam,
      response: { 200: ProductVariantSchema },
    },
    handler: controller.getVariantStock,
  });

  fastify.post('/variants/:variantId/stock/increase', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductVariantIdParam,
      body: StockChangeBody,
      response: { 200: ProductVariantSchema },
    },
    handler: controller.increaseVariantStock,
  });

  fastify.post('/variants/:variantId/stock/decrease', {
    onRequest: [app.authenticate, app.requireRole('admin')],
    schema: {
      tags: ['products'],
      params: ProductVariantIdParam,
      body: StockChangeBody,
      response: { 200: ProductVariantSchema },
    },
    handler: controller.decreaseVariantStock,
  });
}
