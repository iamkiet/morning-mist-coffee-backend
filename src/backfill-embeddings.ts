import { eq, isNull } from 'drizzle-orm';
import { syncProductEmbedding } from './application/product/sync-product-embedding.ts';
import { env } from './config/env.ts';
import { buildDb } from './infrastructure/db/client.ts';
import { productTypes, products } from './infrastructure/db/schema.ts';
import { GeminiClient } from './infrastructure/adapters/gemini.client.ts';
import { GeminiMultimodalEmbeddingAdapter } from './infrastructure/adapters/gemini.multimodal-embedding.ts';
import { PostgresProductRepository } from './infrastructure/repositories/product.repository.ts';
import { logger } from './lib/logger.ts';

const { client, db } = buildDb(env.DATABASE_URL);

async function backfill(): Promise<void> {
  if (!env.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY not configured, cannot backfill embeddings');
    process.exit(1);
  }

  const embedding = new GeminiMultimodalEmbeddingAdapter(
    new GeminiClient(env.GEMINI_API_KEY),
  );
  const productRepo = new PostgresProductRepository(db);

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      origin: products.origin,
      tastingNotes: products.tastingNotes,
      description: products.description,
      typeName: productTypes.name,
    })
    .from(products)
    .innerJoin(productTypes, eq(products.productTypeId, productTypes.id))
    .where(isNull(products.embedding));

  logger.info({ count: rows.length }, 'Backfilling product embeddings');

  for (const { typeName, ...row } of rows) {
    await syncProductEmbedding(productRepo, embedding, logger, row, { name: typeName });
    logger.info({ productId: row.id, name: row.name }, 'Embedding backfilled');
  }

  logger.info('Backfill complete');
}

backfill()
  .catch((err) => {
    logger.error(err, 'Backfill failed');
    process.exit(1);
  })
  .finally(() => client.end());
