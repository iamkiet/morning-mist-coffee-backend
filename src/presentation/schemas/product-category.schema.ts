import { z } from 'zod';

export const ProductCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});

export const CreateProductCategoryBody = z.object({
  name: z.string().min(1).max(100),
});

export const ProductCategoryIdParam = z.object({ id: z.uuid() });

export const UpdateProductCategoryBody = z.object({
  name: z.string().min(1).max(100),
});

export const ProductCategoryListResponse = z.object({
  items: z.array(ProductCategorySchema),
});

export type ProductCategoryDTO = z.infer<typeof ProductCategorySchema>;
