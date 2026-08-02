import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateOrderUseCase } from '../../application/order/create-order.use-case.ts';
import type { GetOrderByIdUseCase } from '../../application/order/get-order-by-id.use-case.ts';
import type { ListOrdersUseCase } from '../../application/order/list-orders.use-case.ts';
import type { LookupOrderUseCase } from '../../application/order/lookup-order.use-case.ts';
import type { UpdateOrderStatusUseCase } from '../../application/order/update-order-status.use-case.ts';
import {
  toOrderDTO,
  toOrderListPayload,
} from '../serializers/order.serializer.ts';
import type {
  CreateOrderBody,
  ListOrdersQuery,
  LookupOrdersQuery,
  OrderIdParam,
  UpdateOrderStatusBody,
} from '../schemas/order.schema.ts';

export interface OrderUseCases {
  list: ListOrdersUseCase;
  getById: GetOrderByIdUseCase;
  lookup: LookupOrderUseCase;
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
    const order = await this.uc.lookup.execute(req.query);
    return reply.send({ items: order ? [toOrderDTO(order)] : [] });
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateOrderBody> }>,
    reply: FastifyReply,
  ) => {
    const order = await this.uc.create.execute({
      email: req.body.email,
      totalCents: req.body.totalCents,
      currency: req.body.currency,
      cashReceivedCents: req.body.cashReceivedCents,
      shippingFirstName: req.body.shippingFirstName,
      shippingLastName: req.body.shippingLastName,
      shippingAddress: req.body.shippingAddress,
      shippingCity: req.body.shippingCity,
      shippingPostalCode: req.body.shippingPostalCode,
      items: req.body.items,
    });
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
