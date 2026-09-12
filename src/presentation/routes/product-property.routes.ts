import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ROLES_ADMIN_STAFF } from '../../domain/auth/auth-role.ts';
import { ProductPropertyController } from '../controllers/product-property.controller.ts';
import {
  CreateProductPropertyBody,
  ProductPropertyListResponse,
  ProductPropertySchema,
} from '../schemas/product-property.schema.ts';

export async function productPropertyRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new ProductPropertyController(app.useCases.productProperty);

  fastify.addHook('onRequest', app.authenticate);
  fastify.addHook('onRequest', app.requireRole(ROLES_ADMIN_STAFF));

  fastify.get('/', {
    schema: {
      tags: ['product-properties'],
      response: { 200: ProductPropertyListResponse },
    },
    handler: controller.list,
  });

  fastify.post('/', {
    schema: {
      tags: ['product-properties'],
      body: CreateProductPropertyBody,
      response: { 201: ProductPropertySchema },
    },
    handler: controller.create,
  });
}
