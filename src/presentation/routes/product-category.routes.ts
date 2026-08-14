import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ProductCategoryController } from '../controllers/product-category.controller.ts';
import {
  CreateProductCategoryBody,
  ProductCategoryListResponse,
  ProductCategorySchema,
} from '../schemas/product-category.schema.ts';

export async function productCategoryRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ProductCategoryController(app.useCases.productCategory);

  fastify.addHook('onRequest', app.authenticate);
  fastify.addHook('onRequest', app.requireRole('admin'));

  fastify.get('/', {
    schema: {
      tags: ['product-categories'],
      response: { 200: ProductCategoryListResponse },
    },
    handler: controller.list,
  });

  fastify.post('/', {
    schema: {
      tags: ['product-categories'],
      body: CreateProductCategoryBody,
      response: { 201: ProductCategorySchema },
    },
    handler: controller.create,
  });
}
