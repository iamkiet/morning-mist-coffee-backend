import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ChatCatalogueProduct } from './build-chat-prompt.ts';

export async function buildCatalogueProducts(
  variants: ProductVariantRepo,
  products: Product[],
): Promise<ChatCatalogueProduct[]> {
  return Promise.all(
    products.map(async (product) => {
      const productVariants = await variants.listByProductId(product.id);
      const priceCents =
        productVariants.length > 0
          ? Math.min(...productVariants.map((v) => v.priceCents))
          : null;

      const valuesPerVariant = await Promise.all(
        productVariants.map((v) => variants.getPropertyValues(v.id)),
      );
      const seen = new Set<string>();
      const propertyLines: ChatCatalogueProduct['propertyLines'] = [];
      for (const values of valuesPerVariant) {
        for (const { propertyName, value } of values) {
          const key = `${propertyName}::${value}`;
          if (seen.has(key)) continue;
          seen.add(key);
          propertyLines.push({ propertyName, value });
        }
      }

      return {
        name: product.name,
        description: product.description,
        priceCents,
        propertyLines,
      };
    }),
  );
}
