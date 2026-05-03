import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ProductTypeController } from '../controllers/product-type.controller.js';
import {
  CreateProductTypeBody,
  ProductTypeListResponse,
  ProductTypeSchema,
} from '../schemas/product-type.schema.js';

export async function productTypeRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ProductTypeController(app.useCases.productType);

  fastify.addHook('onRequest', app.authenticate);

  fastify.get('/', {
    schema: {
      tags: ['product-types'],
      response: { 200: ProductTypeListResponse },
    },
    handler: controller.list,
  });

  fastify.post('/', {
    schema: {
      tags: ['product-types'],
      body: CreateProductTypeBody,
      response: { 201: ProductTypeSchema },
    },
    handler: controller.create,
  });
}
