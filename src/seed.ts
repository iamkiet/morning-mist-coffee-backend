import { env } from './config/env.ts';
import { buildDb } from './infrastructure/db/client.ts';
import {
  productStock,
  productTypes,
  products,
} from './infrastructure/db/schema.ts';
import { slugify } from './domain/product/slugify.ts';
import { logger } from './lib/logger.ts';
import { coffeeProducts, splitDescription, types } from './seed-data.ts';

const { client, db } = buildDb(env.DATABASE_URL);

async function seed() {
  logger.info('Clearing old product and stock data...');
  await db.delete(productStock);
  await db.delete(products);
  await db.delete(productTypes);

  logger.info('Seeding product types...');
  const insertedTypes = await db
    .insert(productTypes)
    .values(types)
    .onConflictDoNothing()
    .returning();

  const allTypes =
    insertedTypes.length > 0
      ? insertedTypes
      : await db.select().from(productTypes);

  const typeMap = Object.fromEntries(allTypes.map((t) => [t.name, t.id]));
  logger.info({ types: Object.keys(typeMap) }, 'Product types ready');

  logger.info('Seeding products...');
  for (const p of coffeeProducts) {
    const typeId = typeMap[p.type];
    if (!typeId) {
      logger.error({ type: p.type }, 'Product type not found, skipping');
      continue;
    }

    const [inserted] = await db
      .insert(products)
      .values({
        slug: slugify(p.name),
        name: p.name,
        ...splitDescription(p.description),
        priceCents: p.priceCents,
        currency: 'VND',
        image: p.image,
        productTypeId: typeId,
      })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      logger.warn({ name: p.name }, 'Product already exists, skipping');
      continue;
    }

    await db
      .insert(productStock)
      .values({ productId: inserted.id, quantity: p.stock });
    logger.info({ name: p.name, stock: p.stock }, 'Product seeded');
  }

  logger.info('Seed complete');
}

seed()
  .catch((err) => {
    logger.error(err, 'Seed failed');
    process.exit(1);
  })
  .finally(() => client.end());
