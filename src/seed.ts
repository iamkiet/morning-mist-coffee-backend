import { env } from './config/env.ts';
import { buildDb } from './infrastructure/db/client.ts';
import {
  productCategories,
  productProperties,
  productVariantPropertyValues,
  productVariants,
  products,
  productsCategories,
} from './infrastructure/db/schema.ts';
import { logger } from './lib/logger.ts';
import type { Currency } from './domain/shared/currency.ts';
import type { PropertyDataType } from './domain/product-property/product-property.entity.ts';
import seedData from './seeds/data.json' with { type: 'json' };

const { client, db } = buildDb(env.DATABASE_URL);

async function seed() {
  logger.info('Clearing old product data...');
  await db.delete(products);
  await db.delete(productCategories);
  await db.delete(productProperties);

  logger.info('Seeding product categories...');
  const categoryIdMap = new Map<string, string>();
  for (const category of seedData.productCategories) {
    const [row] = await db
      .insert(productCategories)
      .values({
        name: category.name,
        parentId: category.parentId
          ? (categoryIdMap.get(category.parentId) ?? null)
          : null,
      })
      .returning();
    if (!row) throw new Error(`Failed to seed category ${category.name}`);
    categoryIdMap.set(category.id, row.id);
  }

  logger.info('Seeding product properties...');
  const propertyIdMap = new Map<string, string>();
  for (const property of seedData.productProperties) {
    const [row] = await db
      .insert(productProperties)
      .values({ name: property.name, dataType: property.dataType as PropertyDataType })
      .returning();
    if (!row) throw new Error(`Failed to seed property ${property.name}`);
    propertyIdMap.set(property.id, row.id);
  }

  logger.info('Seeding products...');
  const productIdMap = new Map<string, string>();
  for (const product of seedData.products) {
    const [row] = await db
      .insert(products)
      .values({
        slug: product.slug,
        name: product.name,
        description: product.description,
        image: product.image,
      })
      .returning();
    if (!row) throw new Error(`Failed to seed product ${product.name}`);
    productIdMap.set(product.id, row.id);
  }

  logger.info('Seeding product variants...');
  const variantIdMap = new Map<string, string>();
  for (const variant of seedData.productVariants) {
    const productId = productIdMap.get(variant.productId);
    if (!productId) {
      logger.error({ variant }, 'Unknown productId, skipping variant');
      continue;
    }
    const [row] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: variant.sku,
        priceCents: variant.priceCents,
        currency: variant.currency as Currency,
        stock: variant.stock,
        expiresAt: variant.expiresAt,
      })
      .returning();
    if (!row) throw new Error(`Failed to seed variant ${variant.sku}`);
    variantIdMap.set(variant.id, row.id);
  }

  logger.info('Seeding variant property values...');
  for (const value of seedData.productVariantPropertyValues) {
    const productVariantId = variantIdMap.get(value.productVariantId);
    const productPropertyId = propertyIdMap.get(value.productPropertyId);
    if (!productVariantId || !productPropertyId) {
      logger.error({ value }, 'Unknown variant or property id, skipping value');
      continue;
    }
    await db
      .insert(productVariantPropertyValues)
      .values({ productVariantId, productPropertyId, value: value.value });
  }

  logger.info('Seeding product categories links...');
  for (const link of seedData.productsCategories) {
    const productId = productIdMap.get(link.productId);
    const productCategoryId = categoryIdMap.get(link.productCategoryId);
    if (!productId || !productCategoryId) {
      logger.error({ link }, 'Unknown product or category id, skipping link');
      continue;
    }
    await db.insert(productsCategories).values({ productId, productCategoryId });
  }

  logger.info(
    'Seed complete. Run `tsx src/backfill-embeddings.ts` to generate product embeddings.',
  );
}

seed()
  .catch((err) => {
    logger.error(err, 'Seed failed');
    process.exit(1);
  })
  .finally(() => client.end());
