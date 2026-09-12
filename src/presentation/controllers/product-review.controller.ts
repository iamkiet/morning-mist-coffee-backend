import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { UnauthorizedError } from '../../lib/errors.ts';
import type { CreateProductReviewUseCase } from '../../application/product-review/create-product-review.use-case.ts';
import type { CreateProductReviewReplyUseCase } from '../../application/product-review/create-product-review-reply.use-case.ts';
import type { GetProductReviewByIdUseCase } from '../../application/product-review/get-product-review-by-id.use-case.ts';
import type { ListProductReviewsUseCase } from '../../application/product-review/list-product-reviews.use-case.ts';
import type { ListPublicProductReviewsUseCase } from '../../application/product-review/list-public-product-reviews.use-case.ts';
import type { UpdateProductReviewStatusUseCase } from '../../application/product-review/update-product-review-status.use-case.ts';
import {
  toProductReviewDTO,
  toProductReviewListPayload,
  toProductReviewReplyDTO,
  toPublicProductReviewListPayload,
} from '../serializers/product-review.serializer.ts';
import type {
  CreateProductReviewBody,
  CreateProductReviewReplyBody,
  ListProductReviewsQuery,
  ListPublicProductReviewsQuery,
  ProductReviewIdParam,
  ProductReviewReplyParams,
  ProductIdParam,
  UpdateProductReviewStatusBody,
} from '../schemas/product-review.schema.ts';

export interface ProductReviewUseCases {
  list: ListProductReviewsUseCase;
  listPublic: ListPublicProductReviewsUseCase;
  getById: GetProductReviewByIdUseCase;
  create: CreateProductReviewUseCase;
  createReply: CreateProductReviewReplyUseCase;
  updateStatus: UpdateProductReviewStatusUseCase;
}

export class ProductReviewController {
  constructor(private readonly uc: ProductReviewUseCases) {}

  list = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof ListProductReviewsQuery> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.list.execute(req.query);
    return reply.send(toProductReviewListPayload(result));
  };

  listPublic = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductIdParam>;
      Querystring: z.infer<typeof ListPublicProductReviewsQuery>;
    }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.listPublic.execute({
      productId: req.params.productId,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return reply.send(toPublicProductReviewListPayload(result));
  };

  getById = async (
    req: FastifyRequest<{ Params: z.infer<typeof ProductReviewIdParam> }>,
    reply: FastifyReply,
  ) => {
    const review = await this.uc.getById.execute(req.params.id);
    return reply.send(toProductReviewDTO(review));
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateProductReviewBody> }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw new UnauthorizedError();
    const review = await this.uc.create.execute({
      ...req.body,
      customerId: req.user.id,
      customerEmail: req.user.email,
    });
    return reply.code(201).send(toProductReviewDTO(review));
  };

  createReply = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductReviewReplyParams>;
      Body: z.infer<typeof CreateProductReviewReplyBody>;
    }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw new UnauthorizedError();
    const created = await this.uc.createReply.execute(req.params.reviewId, {
      authorType: 'customer',
      authorName: req.body.authorName,
      customerId: req.user.id,
      replyText: req.body.replyText,
    });
    return reply.code(201).send(toProductReviewReplyDTO(created));
  };

  createAdminReply = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductReviewReplyParams>;
      Body: z.infer<typeof CreateProductReviewReplyBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const created = await this.uc.createReply.execute(req.params.reviewId, {
      authorType: 'admin',
      authorName: req.body.authorName ?? 'Morning Mist Coffee',
      replyText: req.body.replyText,
    });
    return reply.code(201).send(toProductReviewReplyDTO(created));
  };

  updateStatus = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductReviewIdParam>;
      Body: z.infer<typeof UpdateProductReviewStatusBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const review = await this.uc.updateStatus.execute(req.params.id, req.body);
    return reply.send(toProductReviewDTO(review));
  };
}
