import type { ProductEmbeddingSource } from '../../domain/product/product.entity.ts';

export function buildProductEmbeddingText(source: ProductEmbeddingSource): string {
  const parts = [source.name];
  if (source.categoryNames.length > 0) {
    parts.push(`Loại: ${source.categoryNames.join(', ')}.`);
  }
  for (const { propertyName, value } of source.propertyValues) {
    parts.push(`${propertyName}: ${value}.`);
  }
  if (source.description) {
    parts.push(source.description);
  }
  return parts.join(' ');
}
