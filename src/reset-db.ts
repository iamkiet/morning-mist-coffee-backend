import { sql } from 'drizzle-orm';
import { env } from './config/env.ts';
import { buildDb } from './infrastructure/db/client.ts';
import { logger } from './lib/logger.ts';

const { client, db } = buildDb(env.DATABASE_URL);

const TABLES = [
  'employees',
  'customers',
  'auth_tokens',
  'products',
  'product_variants',
  'product_properties',
  'product_variant_property_values',
  'product_categories',
  'products_categories',
  'orders',
  'order_items',
  'product_reviews',
  'product_review_replies',
];

async function reset(): Promise<void> {
  logger.info({ tables: TABLES }, 'Truncating all tables...');
  await db.execute(sql.raw(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`));
  logger.info('All tables truncated.');
}

reset()
  .catch((err) => {
    logger.error(err, 'Reset failed');
    process.exit(1);
  })
  .finally(() => client.end());
