import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateProductUseCase } from '../../application/product/create-product.use-case.js';
import type { DecreaseStockUseCase } from '../../application/product/decrease-stock.use-case.js';
import type { DeleteProductUseCase } from '../../application/product/delete-product.use-case.js';
import type { GetProductByIdUseCase } from '../../application/product/get-product-by-id.use-case.js';
import type { GetStockUseCase } from '../../application/product/get-stock.use-case.js';
import type { IncreaseStockUseCase } from '../../application/product/increase-stock.use-case.js';
import type { ListProductsUseCase } from '../../application/product/list-products.use-case.js';
import type { UpdateProductUseCase } from '../../application/product/update-product.use-case.js';
import {
  toProductDTO,
  toProductListPayload,
} from '../serializers/product.serializer.js';
import type {
  CreateProductBody,
  ListProductsQuery,
  ProductIdParam,
  StockChangeBody,
  UpdateProductBody,
} from '../schemas/product.schema.js';

export interface ProductUseCases {
  list: ListProductsUseCase;
  getById: GetProductByIdUseCase;
  create: CreateProductUseCase;
  update: UpdateProductUseCase;
  delete: DeleteProductUseCase;
  getStock: GetStockUseCase;
  increaseStock: IncreaseStockUseCase;
  decreaseStock: DecreaseStockUseCase;
}

export class ProductController {
  constructor(private readonly uc: ProductUseCases) {}

  list = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof ListProductsQuery> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.list.execute(req.query);
    return reply.send(toProductListPayload(result));
  };

  getById = async (
    req: FastifyRequest<{ Params: z.infer<typeof ProductIdParam> }>,
    reply: FastifyReply,
  ) => {
    const product = await this.uc.getById.execute(req.params.id);
    return reply.send(toProductDTO(product));
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateProductBody> }>,
    reply: FastifyReply,
  ) => {
    const created = await this.uc.create.execute(req.body);
    return reply.code(201).send(toProductDTO(created));
  };

  update = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductIdParam>;
      Body: z.infer<typeof UpdateProductBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const updated = await this.uc.update.execute(req.params.id, req.body);
    return reply.send(toProductDTO(updated));
  };

  delete = async (
    req: FastifyRequest<{ Params: z.infer<typeof ProductIdParam> }>,
    reply: FastifyReply,
  ) => {
    await this.uc.delete.execute(req.params.id);
    return reply.code(204).send();
  };

  getStock = async (
    req: FastifyRequest<{ Params: z.infer<typeof ProductIdParam> }>,
    reply: FastifyReply,
  ) => {
    const stock = await this.uc.getStock.execute(req.params.id);
    return reply.send(stock);
  };

  increaseStock = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductIdParam>;
      Body: z.infer<typeof StockChangeBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const stock = await this.uc.increaseStock.execute(req.params.id, req.body);
    return reply.send(stock);
  };

  decreaseStock = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductIdParam>;
      Body: z.infer<typeof StockChangeBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const stock = await this.uc.decreaseStock.execute(req.params.id, req.body);
    return reply.send(stock);
  };
}
