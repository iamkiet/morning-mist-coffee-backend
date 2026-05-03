import { z } from 'zod';

export const ProductTypeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateProductTypeBody = z.object({
  name: z.string().min(1).max(100),
});

export const ProductTypeListResponse = z.object({
  items: z.array(ProductTypeSchema),
});

export type ProductTypeDTO = z.infer<typeof ProductTypeSchema>;
