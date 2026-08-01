import { isNull } from 'drizzle-orm';
import { env } from './config/env.js';
import { buildDb } from './infrastructure/db/client.js';
import { products } from './infrastructure/db/schema.js';
import { GeminiMultimodalEmbeddingAdapter } from './infrastructure/adapters/gemini.multimodal-embedding.js';
import { PostgresProductRepository } from './infrastructure/repositories/product.repository.js';
import { logger } from './lib/logger.js';

const { client, db } = buildDb(env.DATABASE_URL);

async function backfill(): Promise<void> {
  if (!env.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY not configured, cannot backfill embeddings');
    process.exit(1);
  }

  const embedding = new GeminiMultimodalEmbeddingAdapter(env.GEMINI_API_KEY);
  const productRepo = new PostgresProductRepository(db);

  const rows = await db
    .select({ id: products.id, name: products.name, description: products.description })
    .from(products)
    .where(isNull(products.embedding));

  logger.info({ count: rows.length }, 'Backfilling product embeddings');

  for (const row of rows) {
    try {
      const doc = `title: ${row.name} | text: ${row.description ?? ''}`;
      const vector = await embedding.embedText(doc);
      await productRepo.updateEmbedding(row.id, vector);
      logger.info({ productId: row.id, name: row.name }, 'Embedding backfilled');
    } catch (err) {
      logger.error({ err, productId: row.id, name: row.name }, 'Failed to backfill embedding');
    }
  }

  logger.info('Backfill complete');
}

backfill()
  .catch((err) => {
    logger.error(err, 'Backfill failed');
    process.exit(1);
  })
  .finally(() => client.end());
