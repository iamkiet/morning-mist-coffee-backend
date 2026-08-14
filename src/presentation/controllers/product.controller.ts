import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { CreateProductUseCase } from '../../application/product/create-product.use-case.ts';
import type { CreateProductVariantUseCase } from '../../application/product/create-product-variant.use-case.ts';
import type { DecreaseVariantStockUseCase } from '../../application/product/decrease-variant-stock.use-case.ts';
import type { DeleteProductUseCase } from '../../application/product/delete-product.use-case.ts';
import type { DeleteProductVariantUseCase } from '../../application/product/delete-product-variant.use-case.ts';
import type { GetProductByIdUseCase } from '../../application/product/get-product-by-id.use-case.ts';
import type { GetProductBySlugUseCase } from '../../application/product/get-product-by-slug.use-case.ts';
import type { GetVariantStockUseCase } from '../../application/product/get-variant-stock.use-case.ts';
import type { IncreaseVariantStockUseCase } from '../../application/product/increase-variant-stock.use-case.ts';
import type { ListProductsUseCase } from '../../application/product/list-products.use-case.ts';
import type { SetProductCategoriesUseCase } from '../../application/product/set-product-categories.use-case.ts';
import type { SetVariantPropertyValuesUseCase } from '../../application/product/set-variant-property-values.use-case.ts';
import type { UpdateProductUseCase } from '../../application/product/update-product.use-case.ts';
import type { UpdateProductVariantUseCase } from '../../application/product/update-product-variant.use-case.ts';
import {
  toProductDTO,
  toProductListPayload,
  toProductVariantDTO,
} from '../serializers/product.serializer.ts';
import type {
  CreateProductBody,
  CreateProductVariantBody,
  ListProductsQuery,
  ProductIdParam,
  ProductSlugParam,
  ProductVariantIdParam,
  SetProductCategoriesBody,
  SetVariantPropertyValuesBody,
  StockChangeBody,
  UpdateProductBody,
  UpdateProductVariantBody,
} from '../schemas/product.schema.ts';

export interface ProductUseCases {
  list: ListProductsUseCase;
  getById: GetProductByIdUseCase;
  getBySlug: GetProductBySlugUseCase;
  create: CreateProductUseCase;
  update: UpdateProductUseCase;
  delete: DeleteProductUseCase;
  createVariant: CreateProductVariantUseCase;
  updateVariant: UpdateProductVariantUseCase;
  deleteVariant: DeleteProductVariantUseCase;
  getVariantStock: GetVariantStockUseCase;
  increaseVariantStock: IncreaseVariantStockUseCase;
  decreaseVariantStock: DecreaseVariantStockUseCase;
  setCategories: SetProductCategoriesUseCase;
  setVariantPropertyValues: SetVariantPropertyValuesUseCase;
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

  getBySlug = async (
    req: FastifyRequest<{ Params: z.infer<typeof ProductSlugParam> }>,
    reply: FastifyReply,
  ) => {
    const product = await this.uc.getBySlug.execute(req.params.slug);
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

  setCategories = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductIdParam>;
      Body: z.infer<typeof SetProductCategoriesBody>;
    }>,
    reply: FastifyReply,
  ) => {
    await this.uc.setCategories.execute(req.params.id, req.body.categoryIds);
    return reply.code(204).send();
  };

  createVariant = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductIdParam>;
      Body: z.infer<typeof CreateProductVariantBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const variant = await this.uc.createVariant.execute(req.params.id, req.body);
    return reply.code(201).send(toProductVariantDTO(variant));
  };

  updateVariant = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductVariantIdParam>;
      Body: z.infer<typeof UpdateProductVariantBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const variant = await this.uc.updateVariant.execute(
      req.params.variantId,
      req.body,
    );
    return reply.send(toProductVariantDTO(variant));
  };

  deleteVariant = async (
    req: FastifyRequest<{ Params: z.infer<typeof ProductVariantIdParam> }>,
    reply: FastifyReply,
  ) => {
    await this.uc.deleteVariant.execute(req.params.variantId);
    return reply.code(204).send();
  };

  setVariantPropertyValues = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductVariantIdParam>;
      Body: z.infer<typeof SetVariantPropertyValuesBody>;
    }>,
    reply: FastifyReply,
  ) => {
    await this.uc.setVariantPropertyValues.execute(
      req.params.variantId,
      req.body.values,
    );
    return reply.code(204).send();
  };

  getVariantStock = async (
    req: FastifyRequest<{ Params: z.infer<typeof ProductVariantIdParam> }>,
    reply: FastifyReply,
  ) => {
    const variant = await this.uc.getVariantStock.execute(req.params.variantId);
    return reply.send(toProductVariantDTO(variant));
  };

  increaseVariantStock = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductVariantIdParam>;
      Body: z.infer<typeof StockChangeBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const variant = await this.uc.increaseVariantStock.execute(
      req.params.variantId,
      req.body,
    );
    return reply.send(toProductVariantDTO(variant));
  };

  decreaseVariantStock = async (
    req: FastifyRequest<{
      Params: z.infer<typeof ProductVariantIdParam>;
      Body: z.infer<typeof StockChangeBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const variant = await this.uc.decreaseVariantStock.execute(
      req.params.variantId,
      req.body,
    );
    return reply.send(toProductVariantDTO(variant));
  };
}
