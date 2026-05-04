import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateOrderUseCase } from '../../application/order/create-order.use-case.js';
import type { GetOrderByIdUseCase } from '../../application/order/get-order-by-id.use-case.js';
import type { ListOrdersUseCase } from '../../application/order/list-orders.use-case.js';
import type { UpdateOrderStatusUseCase } from '../../application/order/update-order-status.use-case.js';
import {
  toOrderDTO,
  toOrderListPayload,
} from '../serializers/order.serializer.js';
import type {
  CreateOrderBody,
  ListOrdersQuery,
  LookupOrdersQuery,
  OrderIdParam,
  UpdateOrderStatusBody,
} from '../schemas/order.schema.js';
import { normalizeEmail } from '../../domain/user/user.entity.js';

export interface OrderUseCases {
  list: ListOrdersUseCase;
  getById: GetOrderByIdUseCase;
  create: CreateOrderUseCase;
  updateStatus: UpdateOrderStatusUseCase;
}

export class OrderController {
  constructor(private readonly uc: OrderUseCases) {}

  list = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof ListOrdersQuery> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.list.execute(req.query);
    return reply.send(toOrderListPayload(result));
  };

  getById = async (
    req: FastifyRequest<{ Params: z.infer<typeof OrderIdParam> }>,
    reply: FastifyReply,
  ) => {
    const order = await this.uc.getById.execute(req.params.id);
    return reply.send(toOrderDTO(order));
  };

  lookup = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof LookupOrdersQuery> }>,
    reply: FastifyReply,
  ) => {
    const email = normalizeEmail(req.query.email);
    const result = await this.uc.list.execute({
      email,
      sortBy: 'createdAt',
      sortDir: 'desc',
      limit: 50,
      offset: 0,
    });
    return reply.send({ items: result.items.map(toOrderDTO) });
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateOrderBody> }>,
    reply: FastifyReply,
  ) => {
    const order = await this.uc.create.execute(req.body);
    return reply.code(201).send(toOrderDTO(order));
  };

  updateStatus = async (
    req: FastifyRequest<{
      Params: z.infer<typeof OrderIdParam>;
      Body: z.infer<typeof UpdateOrderStatusBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const order = await this.uc.updateStatus.execute(req.params.id, req.body);
    return reply.send(toOrderDTO(order));
  };
}
