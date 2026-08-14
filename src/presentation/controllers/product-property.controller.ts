import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateProductPropertyUseCase } from '../../application/product-property/create-product-property.use-case.ts';
import type { ListProductPropertiesUseCase } from '../../application/product-property/list-product-properties.use-case.ts';
import type { CreateProductPropertyBody } from '../schemas/product-property.schema.ts';
import { toProductPropertyDTO } from '../serializers/product-property.serializer.ts';

export interface ProductPropertyUseCases {
  list: ListProductPropertiesUseCase;
  create: CreateProductPropertyUseCase;
}

export class ProductPropertyController {
  constructor(private readonly uc: ProductPropertyUseCases) {}

  list = async (_req: FastifyRequest, reply: FastifyReply) => {
    const items = await this.uc.list.execute();
    return reply.send({ items: items.map(toProductPropertyDTO) });
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateProductPropertyBody> }>,
    reply: FastifyReply,
  ) => {
    const created = await this.uc.create.execute(req.body);
    return reply.code(201).send(toProductPropertyDTO(created));
  };
}
