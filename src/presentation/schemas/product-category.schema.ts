import { z } from 'zod';

export const ProductCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  parentId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});

export const CreateProductCategoryBody = z.object({
  name: z.string().min(1).max(100),
  parentId: z.uuid().nullable().optional(),
});

export const ProductCategoryListResponse = z.object({
  items: z.array(ProductCategorySchema),
});

export type ProductCategoryDTO = z.infer<typeof ProductCategorySchema>;
