import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateProductTypeUseCase } from '../../application/product-type/create-product-type.use-case.ts';
import type { ListProductTypesUseCase } from '../../application/product-type/list-product-types.use-case.ts';
import type { CreateProductTypeBody } from '../schemas/product-type.schema.ts';
import { toProductTypeDTO } from '../serializers/product-type.serializer.ts';

export interface ProductTypeUseCases {
  list: ListProductTypesUseCase;
  create: CreateProductTypeUseCase;
}

export class ProductTypeController {
  constructor(private readonly uc: ProductTypeUseCases) {}

  list = async (_req: FastifyRequest, reply: FastifyReply) => {
    const items = await this.uc.list.execute();
    return reply.send({ items: items.map(toProductTypeDTO) });
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateProductTypeBody> }>,
    reply: FastifyReply,
  ) => {
    const created = await this.uc.create.execute(req.body);
    return reply.code(201).send(toProductTypeDTO(created));
  };
}
