import { z } from 'zod';
import { CURRENCIES } from '../../domain/shared/currency.ts';
import {
  paginatedResponse,
  paginationFields,
  sortFields,
} from './_pagination.ts';

export const CurrencySchema = z.enum(CURRENCIES);

export const VariantPropertyValueSchema = z.object({
  propertyId: z.uuid(),
  propertyName: z.string(),
  value: z.string(),
});

export const ProductVariantSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  sku: z.string(),
  priceCents: z.number().int().min(0),
  currency: CurrencySchema,
  stock: z.number().int().min(0),
  expiresAt: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  propertyValues: z.array(VariantPropertyValueSchema).optional(),
});

export const ProductSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  variants: z.array(ProductVariantSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateProductVariantBody = z.object({
  sku: z.string().min(1).max(100),
  priceCents: z.number().int().min(0),
  currency: CurrencySchema.optional(),
  stock: z.number().int().min(0).optional(),
  expiresAt: z.string().nullable().optional(),
  propertyValues: z
    .array(z.object({ propertyId: z.uuid(), value: z.string().min(1) }))
    .optional(),
});

export const UpdateProductVariantBody = z
  .object({
    sku: z.string().min(1).max(100).optional(),
    priceCents: z.number().int().min(0).optional(),
    currency: CurrencySchema.optional(),
    stock: z.number().int().min(0).optional(),
    expiresAt: z.string().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field required',
  });

export const CreateProductBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  image: z.string().url().max(2048).nullable().optional(),
  categoryIds: z.array(z.uuid()).optional(),
  variant: CreateProductVariantBody,
});

export const UpdateProductBody = z
  .object({
    slug: z.string().min(1).max(220).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    image: z.string().url().max(2048).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field required',
  });

export const SetProductCategoriesBody = z.object({
  categoryIds: z.array(z.uuid()),
});

export const SetVariantPropertyValuesBody = z.object({
  values: z.array(z.object({ propertyId: z.uuid(), value: z.string().min(1) })),
});

export const ProductIdParam = z.object({ id: z.uuid() });

export const ProductSlugParam = z.object({ slug: z.string().min(1).max(220) });

export const ProductVariantIdParam = z.object({ variantId: z.uuid() });

export const ListProductsQuery = z.object({
  categoryId: z.uuid().optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  q: z.string().min(1).max(200).optional(),
  ...sortFields(['createdAt', 'name']),
  ...paginationFields,
});

export const ProductListResponse = paginatedResponse(ProductSchema);

export const StockChangeBody = z.object({
  quantity: z.number().int().min(1),
});

export type ProductDTO = z.infer<typeof ProductSchema>;
export type ProductVariantDTO = z.infer<typeof ProductVariantSchema>;
