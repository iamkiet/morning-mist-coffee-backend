import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.js';
import type { Product } from '../../domain/product/product.entity.js';
import type { ProductRepo } from '../../domain/product/product.repo.js';

export interface EmbeddingSyncLogger {
  warn(obj: Record<string, unknown>, msg: string): void;
}

export async function syncProductEmbedding(
  products: ProductRepo,
  embedding: MultimodalEmbeddingPort,
  logger: EmbeddingSyncLogger,
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
