import { z } from 'zod';
import { PROPERTY_DATA_TYPES } from '../../domain/product-property/product-property.entity.ts';

export const PropertyDataTypeSchema = z.enum(PROPERTY_DATA_TYPES);

export const ProductPropertySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  dataType: PropertyDataTypeSchema,
  createdAt: z.iso.datetime(),
});

export const CreateProductPropertyBody = z.object({
  name: z.string().min(1).max(100),
  dataType: PropertyDataTypeSchema.optional(),
});

export const ProductPropertyListResponse = z.object({
  items: z.array(ProductPropertySchema),
});

export type ProductPropertyDTO = z.infer<typeof ProductPropertySchema>;
