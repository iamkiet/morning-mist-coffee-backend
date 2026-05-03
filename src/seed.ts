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
    image: 'https://todaywegrind.com/products/coffee1.png',
  },
  {
    type: 'Arabica',
    name: 'Highland Single Origin Arabica',
    description:
      'Single-origin Arabica sourced from the highlands of Da Lat, Vietnam. Light roast with floral aromas and a bright, clean finish.',
    priceCents: 2400,
    stock: 30,
    image: 'https://todaywegrind.com/products/coffee2.png',
  },
  {
    type: 'Arabica',
    name: 'Honey Process Arabica',
    description:
      'Honey-processed Arabica with a naturally sweet body, stone fruit notes, and low acidity. Great as both a pour-over and cold brew.',
    priceCents: 2200,
    stock: 40,
    image: 'https://todaywegrind.com/products/coffee3.png',
  },
  {
    type: 'Robusta',
    name: 'Bold Robusta Espresso',
    description:
      'A high-caffeine Robusta with a full body, earthy depth, and a thick crema. Ideal for Vietnamese-style iced coffee with condensed milk.',
    priceCents: 1400,
    stock: 60,
    image: 'https://todaywegrind.com/products/coffee4.png',
  },
  {
    type: 'Robusta',
    name: 'Dark Roast Robusta',
    description:
      'Intensely roasted Robusta with bitter chocolate and smoky notes. Strong, bold, and built for those who like their coffee without compromise.',
    priceCents: 1600,
    stock: 45,
    image: 'https://todaywegrind.com/products/coffee5.png',
  },
  {
    type: 'Robusta',
    name: 'Butter Roasted Robusta',
    description:
      'Traditional Vietnamese butter-roasted Robusta. Rich, velvety, and slightly sweet — the classic base for cà phê sữa đá.',
    priceCents: 1500,
    stock: 55,
    image: 'https://todaywegrind.com/products/coffee6.png',
  },
  {
    type: 'Arabica',
    name: 'Ethiopian Yirgacheffe',
    description:
      'Vibrant Ethiopian Arabica with berry and wine notes. Complex, fruity, and aromatic with a tea-like body that brightens any morning.',
    priceCents: 2500,
    stock: 35,
    image: 'https://todaywegrind.com/products/coffee7.png',
  },
  {
    type: 'Arabica',
    name: 'Colombian Geisha',
    description:
      'Rare Colombian geisha varietal with extraordinary floral and citrus notes. A premium single-origin prized by specialty coffee enthusiasts.',
    priceCents: 3500,
    stock: 15,
    image: 'https://todaywegrind.com/products/coffee8.png',
  },
  {
    type: 'Arabica',
    name: 'Brazilian Natural Process',
    description:
      'Naturally-processed Brazilian Arabica with nutty, chocolate undertones and a full body. Smooth and forgiving, perfect for espresso.',
    priceCents: 1900,
    stock: 48,
    image: 'https://todaywegrind.com/products/coffee9.png',
  },
  {
    type: 'Arabica',
    name: 'Kenyan AA Peaberry',
    description:
      'Kenya AA peaberry beans with bright acidity, blackcurrant flavors, and a floral aroma. A classic African microlot.',
    priceCents: 2600,
    stock: 28,
    image: 'https://todaywegrind.com/products/coffee10.png',
  },
  {
    type: 'Robusta',
    name: 'Indian Monsoon Malabar',
    description:
      'Unique monsoon-dried Robusta from Kerala, India. Low acidity, earthy, with a bold texture and hints of spice and leather.',
    priceCents: 1700,
    stock: 38,
    image: 'https://todaywegrind.com/products/coffee11.png',
  },
  {
    type: 'Robusta',
    name: 'Indonesian Sumatra',
    description:
      'Wet-hulled Sumatran Robusta with herbal depth and earthy body. A distinctive southeast Asian coffee with low acidity.',
    priceCents: 1550,
    stock: 42,
    image: 'https://todaywegrind.com/products/coffee12.png',
  },
  {
    type: 'Arabica',
    name: 'Guatemalan Huehuetenango',
    description:
      'Highland Guatemalan Arabica with chocolate, spice, and citrus notes. A well-balanced coffee with moderate acidity and body.',
    priceCents: 2100,
    stock: 36,
    image: 'https://todaywegrind.com/products/coffee13.png',
  },
  {
    type: 'Arabica',
    name: 'Costa Rican Tarrazú',
    description:
      'Tarrazú valley Arabica with caramel sweetness, chocolate, and subtle citrus. Balanced acidity and rich, velvety body.',
    priceCents: 2050,
    stock: 41,
    image: 'https://todaywegrind.com/products/coffee14.png',
  },
  {
    type: 'Robusta',
    name: 'Vietnamese Central Highlands',
    description:
      'Authentic Robusta from Vietnam\'s premier coffee region. Bold, earthy, with notes of tobacco and dark chocolate.',
    priceCents: 1450,
    stock: 65,
    image: 'https://todaywegrind.com/products/coffee15.png',
  },
  {
    type: 'Arabica',
    name: 'Panama Geisha',
    description:
      'Limited edition Panamanian geisha with floral complexity, jasmine notes, and tropical fruit finish. A collector\'s favorite.',
    priceCents: 3800,
    stock: 10,
    image: 'https://todaywegrind.com/products/coffee16.png',
  },
  {
    type: 'Arabica',
    name: 'Peruvian Organic Fair Trade',
    description:
      'Certified organic Peruvian Arabica grown by fair-trade cooperatives. Balanced flavor with chocolate, nut, and fruity undertones.',
    priceCents: 1950,
    stock: 44,
    image: 'https://todaywegrind.com/products/coffee17.png',
  },
  {
    type: 'Robusta',
    name: 'Ugandan Bugisu',
    description:
      'East African Robusta with rich body, spicy notes, and earthy finish. A bold choice for those seeking intensity and character.',
    priceCents: 1650,
    stock: 39,
    image: 'https://todaywegrind.com/products/coffee18.png',
  },
  {
    type: 'Arabica',
    name: 'Tanzanian Kilimanjaro',
    description:
      'Grown on the slopes of Mount Kilimanjaro, this Arabica offers wine-like acidity, fruit flavors, and full body.',
    priceCents: 2300,
    stock: 33,
    image: 'https://todaywegrind.com/products/coffee19.png',
  },
  {
    type: 'Arabica',
    name: 'Mexican Oaxaca',
    description:
      'Mexican highlands Arabica with subtle spice, chocolate sweetness, and medium acidity. Versatile and reliably delicious.',
    priceCents: 1850,
    stock: 47,
    image: 'https://todaywegrind.com/products/coffee20.png',
  },
] satisfies {
  type: 'Arabica' | 'Robusta';
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  image: string;
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
