export const PROPERTY_DATA_TYPES = ['text', 'number', 'enum'] as const;
export type PropertyDataType = (typeof PROPERTY_DATA_TYPES)[number];

export interface ProductProperty {
  id: string;
  name: string;
  dataType: PropertyDataType;
  createdAt: Date;
}

export interface CreateProductPropertyInput {
  name: string;
  dataType?: PropertyDataType;
}
