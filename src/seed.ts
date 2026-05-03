import { env } from './config/env.js';
import { buildDb } from './infrastructure/db/client.js';
import {
  productStock,
  productTypes,
  products,
} from './infrastructure/db/schema.js';
import { logger } from './lib/logger.js';

const { client, db } = buildDb(env.DATABASE_URL);

const types = [{ name: 'Arabica' }, { name: 'Robusta' }];

const coffeeProducts = [
  {
    type: 'Arabica',
    name: 'Morning Mist Arabica Blend',
    description:
      'A smooth, well-balanced Arabica blend with notes of dark chocolate, caramel, and a hint of citrus. Perfect for a calm morning brew.',
    priceCents: 1800,
    stock: 50,
  },
  {
    type: 'Arabica',
    name: 'Highland Single Origin Arabica',
    description:
      'Single-origin Arabica sourced from the highlands of Da Lat, Vietnam. Light roast with floral aromas and a bright, clean finish.',
    priceCents: 2400,
    stock: 30,
  },
  {
    type: 'Arabica',
    name: 'Honey Process Arabica',
    description:
      'Honey-processed Arabica with a naturally sweet body, stone fruit notes, and low acidity. Great as both a pour-over and cold brew.',
    priceCents: 2200,
    stock: 40,
  },
  {
    type: 'Robusta',
    name: 'Bold Robusta Espresso',
    description:
      'A high-caffeine Robusta with a full body, earthy depth, and a thick crema. Ideal for Vietnamese-style iced coffee with condensed milk.',
    priceCents: 1400,
    stock: 60,
  },
  {
    type: 'Robusta',
    name: 'Dark Roast Robusta',
    description:
      'Intensely roasted Robusta with bitter chocolate and smoky notes. Strong, bold, and built for those who like their coffee without compromise.',
    priceCents: 1600,
    stock: 45,
  },
  {
    type: 'Robusta',
    name: 'Butter Roasted Robusta',
    description:
      'Traditional Vietnamese butter-roasted Robusta. Rich, velvety, and slightly sweet — the classic base for cà phê sữa đá.',
    priceCents: 1500,
    stock: 55,
  },
] satisfies {
  type: 'Arabica' | 'Robusta';
  name: string;
  description: string;
  priceCents: number;
  stock: number;
}[];

async function seed() {
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
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        currency: 'USD',
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
