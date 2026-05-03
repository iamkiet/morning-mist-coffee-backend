import { z } from 'zod';
import { CURRENCIES } from '../../domain/shared/currency.js';
import { paginatedResponse, paginationFields, sortFields } from './_pagination.js';

export const CurrencySchema = z.enum(CURRENCIES);

export const ProductSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  priceCents: z.number().int().min(0),
  currency: CurrencySchema,
  image: z.string().nullable(),
  productTypeId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateProductBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  priceCents: z.number().int().min(0),
  currency: CurrencySchema.optional(),
  image: z.string().url().max(2048).nullable().optional(),
  productTypeId: z.uuid(),
});

export const UpdateProductBody = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    priceCents: z.number().int().min(0).optional(),
    currency: CurrencySchema.optional(),
    image: z.string().url().max(2048).nullable().optional(),
    productTypeId: z.uuid().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const ProductIdParam = z.object({ id: z.uuid() });

export const ListProductsQuery = z.object({
  productTypeId: z.uuid().optional(),
  currency: CurrencySchema.optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  q: z.string().min(1).max(200).optional(),
  ...sortFields(['createdAt', 'name', 'priceCents']),
  ...paginationFields,
});

export const ProductListResponse = paginatedResponse(ProductSchema);

export const ProductStockSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(0),
});

export const StockChangeBody = z.object({
  quantity: z.number().int().min(1),
});

export type ProductDTO = z.infer<typeof ProductSchema>;
