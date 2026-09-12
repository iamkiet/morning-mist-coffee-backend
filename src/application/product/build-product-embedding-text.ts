import type { ProductEmbeddingSource } from '../../domain/product/product.entity.ts';
import { toNaturalCategoryLabel } from '../../domain/product-category/format-category-label.ts';

export function buildProductEmbeddingText(source: ProductEmbeddingSource): string {
  const parts = [source.name];
  if (source.categoryNames.length > 0) {
    const categories = source.categoryNames.map(toNaturalCategoryLabel);
    parts.push(`Loại: ${categories.join(', ')}.`);
  }
  for (const { propertyName, value } of source.propertyValues) {
    parts.push(`${propertyName}: ${value}.`);
  }
  if (source.description) {
    parts.push(source.description);
  }
  return parts.join(' ');
}
