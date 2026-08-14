import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateProductCategoryUseCase } from '../../application/product-category/create-product-category.use-case.ts';
import type { ListProductCategoriesUseCase } from '../../application/product-category/list-product-categories.use-case.ts';
import type { CreateProductCategoryBody } from '../schemas/product-category.schema.ts';
import { toProductCategoryDTO } from '../serializers/product-category.serializer.ts';

export interface ProductCategoryUseCases {
  list: ListProductCategoriesUseCase;
  create: CreateProductCategoryUseCase;
}

export class ProductCategoryController {
  constructor(private readonly uc: ProductCategoryUseCases) {}

  list = async (_req: FastifyRequest, reply: FastifyReply) => {
    const items = await this.uc.list.execute();
    return reply.send({ items: items.map(toProductCategoryDTO) });
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateProductCategoryBody> }>,
    reply: FastifyReply,
  ) => {
    const created = await this.uc.create.execute(req.body);
    return reply.code(201).send(toProductCategoryDTO(created));
  };
}
