import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateOrderReviewUseCase } from '../../application/order-review/create-order-review.use-case.ts';
import type { GetOrderReviewByIdUseCase } from '../../application/order-review/get-order-review-by-id.use-case.ts';
import type { ListOrderReviewsUseCase } from '../../application/order-review/list-order-reviews.use-case.ts';
import type { ListPublicOrderReviewsUseCase } from '../../application/order-review/list-public-order-reviews.use-case.ts';
import type { UpdateOrderReviewStatusUseCase } from '../../application/order-review/update-order-review-status.use-case.ts';
import {
  toOrderReviewDTO,
  toOrderReviewListPayload,
  toPublicOrderReviewListPayload,
} from '../serializers/order-review.serializer.ts';
import type {
  CreateOrderReviewBody,
  ListOrderReviewsQuery,
  ListPublicOrderReviewsQuery,
  OrderReviewIdParam,
  ProductIdParam,
  UpdateOrderReviewStatusBody,
} from '../schemas/order-review.schema.ts';

export interface OrderReviewUseCases {
  list: ListOrderReviewsUseCase;
  listPublic: ListPublicOrderReviewsUseCase;
  getById: GetOrderReviewByIdUseCase;
  create: CreateOrderReviewUseCase;
  updateStatus: UpdateOrderReviewStatusUseCase;
}

export class OrderReviewController {
  constructor(private readonly uc: OrderReviewUseCases) {}

  list = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof ListOrderReviewsQuery> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.list.execute(req.query);
    return reply.send(toOrderReviewListPayload(result));
  };

  listPublic = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductIdParam>;
      Querystring: z.infer<typeof ListPublicOrderReviewsQuery>;
    }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.listPublic.execute({
      productId: req.params.productId,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return reply.send(toPublicOrderReviewListPayload(result));
  };

  getById = async (
    req: FastifyRequest<{ Params: z.infer<typeof OrderReviewIdParam> }>,
    reply: FastifyReply,
  ) => {
    const review = await this.uc.getById.execute(req.params.id);
    return reply.send(toOrderReviewDTO(review));
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateOrderReviewBody> }>,
    reply: FastifyReply,
  ) => {
    const review = await this.uc.create.execute(req.body);
    return reply.code(201).send(toOrderReviewDTO(review));
  };

  updateStatus = async (
    req: FastifyRequest<{
      Params: z.infer<typeof OrderReviewIdParam>;
      Body: z.infer<typeof UpdateOrderReviewStatusBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const review = await this.uc.updateStatus.execute(req.params.id, req.body);
    return reply.send(toOrderReviewDTO(review));
  };
}
