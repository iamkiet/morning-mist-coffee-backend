import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ChatCatalogueProduct } from './build-chat-prompt.ts';

export async function buildCatalogueProducts(
  productRepo: ProductRepo,
  variants: ProductVariantRepo,
  products: Product[],
): Promise<ChatCatalogueProduct[]> {
  const productIds = products.map((p) => p.id);
  const [variantsByProduct, embeddingSources] = await Promise.all([
    variants.listByProductIds(productIds),
    Promise.all(products.map((p) => productRepo.getEmbeddingSource(p.id))),
  ]);

  const allVariantIds = [...variantsByProduct.values()].flat().map((v) => v.id);
  const propertyValuesByVariant = await variants.getPropertyValuesByVariantIds(allVariantIds);

  return products.map((product, i) => ({
    name: product.name,
    description: product.description,
    categoryNames: embeddingSources[i]?.categoryNames ?? [],
    variants: (variantsByProduct.get(product.id) ?? []).map((v) => ({
      priceCents: v.priceCents,
      stock: v.stock,
      propertyValues: propertyValuesByVariant.get(v.id) ?? [],
    })),
  }));
}
