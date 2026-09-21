import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ROLES_ADMIN_STAFF } from '../../domain/auth/auth-role.ts';
import { ProductCategoryController } from '../controllers/product-category.controller.ts';
import {
  CreateProductCategoryBody,
  ProductCategoryIdParam,
  ProductCategoryListResponse,
  ProductCategorySchema,
  UpdateProductCategoryBody,
} from '../schemas/product-category.schema.ts';

export async function productCategoryRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ProductCategoryController(app.useCases.productCategory);

  // Public — category names/tree aren't sensitive, and the storefront needs
  // this to build its category filter without an admin session.
  fastify.get('/', {
    schema: {
      tags: ['product-categories'],
      response: { 200: ProductCategoryListResponse },
    },
    handler: controller.list,
  });

  fastify.post('/', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['product-categories'],
      body: CreateProductCategoryBody,
      response: { 201: ProductCategorySchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.create,
  });

  fastify.patch('/:id', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['product-categories'],
      params: ProductCategoryIdParam,
      body: UpdateProductCategoryBody,
      response: { 200: ProductCategorySchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.update,
  });

  fastify.delete('/:id', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['product-categories'],
      params: ProductCategoryIdParam,
      response: { 204: z.null() },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.delete,
  });
}
