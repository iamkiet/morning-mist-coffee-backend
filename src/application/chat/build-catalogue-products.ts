import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ChatCatalogueProduct } from './build-chat-prompt.ts';

export async function buildCatalogueProducts(
  productRepo: ProductRepo,
  variants: ProductVariantRepo,
  products: Product[],
): Promise<ChatCatalogueProduct[]> {
  return Promise.all(
    products.map(async (product) => {
      const [productVariants, embeddingSource] = await Promise.all([
        variants.listByProductId(product.id),
        productRepo.getEmbeddingSource(product.id),
      ]);

      const catalogueVariants = await Promise.all(
        productVariants.map(async (v) => ({
          priceCents: v.priceCents,
          stock: v.stock,
          propertyValues: await variants.getPropertyValues(v.id),
        })),
      );

      return {
        name: product.name,
        description: product.description,
        categoryNames: embeddingSource?.categoryNames ?? [],
        variants: catalogueVariants,
      };
    }),
  );
}
