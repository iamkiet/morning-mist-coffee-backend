import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import { buildProductEmbeddingText } from './build-product-embedding-text.ts';

export async function syncProductEmbedding(
  productId: string,
  products: ProductRepo,
  embedding: MultimodalEmbeddingPort,
  logger: AppLogger,
): Promise<void> {
  try {
    const source = await products.getEmbeddingSource(productId);
    if (!source) return;
    const doc = buildProductEmbeddingText(source);
    const vector = await embedding.embedDocument(doc);
    await products.updateEmbedding(productId, vector);
  } catch (err) {
    logger.warn({ err, productId }, 'Failed to sync product embedding');
  }
}
