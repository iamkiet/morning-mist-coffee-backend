import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { Product } from '../../domain/product/product.entity.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';

export async function syncProductEmbedding(
  products: ProductRepo,
  embedding: MultimodalEmbeddingPort,
  logger: AppLogger,
  product: Pick<Product, 'id' | 'name' | 'origin' | 'tastingNotes' | 'description'>,
): Promise<void> {
  try {
    const doc = [
      `title: ${product.name}`,
      `origin: ${product.origin ?? ''}`,
      `notes: ${product.tastingNotes.join(', ')}`,
      `text: ${product.description ?? ''}`,
    ].join(' | ');
    const vector = await embedding.embedText(doc);
    await products.updateEmbedding(product.id, vector);
  } catch (err) {
    logger.warn({ err, productId: product.id }, 'Failed to sync product embedding');
  }
}
