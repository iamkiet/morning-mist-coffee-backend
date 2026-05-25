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
    name: 'Cà phê Phối Trộn Arabica Morning Mist',
    description:
      'Hỗn hợp Arabica êm dịu, cân bằng với hương vị sô-cô-la đen, caramel và một chút cam quýt. Hoàn hảo cho một buổi sáng thanh lành.',
    priceCents: 1800,
    stock: 50,
    image: 'https://todaywegrind.com/products/coffee1.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Arabica Nguyên Bản Vùng Cao',
    description:
      'Cà phê Arabica nguyên bản từ vùng cao nguyên Đà Lạt, Việt Nam. Rang mộc nhẹ nhàng với hương hoa thơm ngát và hậu vị sáng, sạch.',
    priceCents: 2400,
    stock: 30,
    image: 'https://todaywegrind.com/products/coffee2.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Arabica Chế Biến Mật Ong',
    description:
      'Cà phê Arabica chế biến theo phương pháp mật ong với vị ngọt tự nhiên, nốt hương quả mọng và độ chua thấp. Thích hợp cho cả pha phin và cold brew.',
    priceCents: 2200,
    stock: 40,
    image: 'https://todaywegrind.com/products/coffee3.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Espresso Đậm Đà',
    description:
      'Cà phê Robusta hàm lượng caffeine cao với hương vị đậm đà, crema dày mịn. Lý tưởng để pha cà phê sữa đá truyền Việt Nam.',
    priceCents: 1400,
    stock: 60,
    image: 'https://todaywegrind.com/products/coffee4.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Rang Đậm',
    description:
      'Cà phê Robusta rang đậm đặc trưng với nốt sô-cô-la đắng và hương khói mạnh mẽ. Đậm vị và nguyên bản cho những ai yêu thích vị cà phê truyền thống.',
    priceCents: 1600,
    stock: 45,
    image: 'https://todaywegrind.com/products/coffee5.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Rang Bơ',
    description:
      'Cà phê Robusta rang bơ truyền thống của Việt Nam. Thơm ngậy, êm mượt và ngọt dịu — nền tảng kinh điển cho món cà phê sữa đá.',
    priceCents: 1500,
    stock: 55,
    image: 'https://todaywegrind.com/products/coffee6.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Ethiopian Yirgacheffe',
    description:
      'Cà phê Arabica Ethiopia sống động với nốt hương quả mọng và rượu vang. Hương thơm trà hoa phức hợp, làm bừng sáng mọi buổi sáng.',
    priceCents: 2500,
    stock: 35,
    image: 'https://todaywegrind.com/products/coffee7.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Colombian Geisha',
    description:
      'Giống cà phê Geisha quý hiếm từ Colombia với hương hoa cỏ và cam quýt đặc sắc. Dòng sản phẩm cao cấp được giới sành cà phê săn đón.',
    priceCents: 3500,
    stock: 15,
    image: 'https://todaywegrind.com/products/coffee8.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Brazil Chế Biến Tự Nhiên',
    description:
      'Cà phê Arabica Brazil chế biến tự nhiên với nốt hương hạt dẻ, sô-cô-la và hậu vị êm mượt. Hương vị cân bằng, hoàn hảo để pha espresso.',
    priceCents: 1900,
    stock: 48,
    image: 'https://todaywegrind.com/products/coffee9.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Kenya AA Peaberry',
    description:
      'Hạt cà phê Peaberry Kenya AA với độ chua sáng, hương vị lý chua đen và hương hoa quyến rũ. Một cực phẩm cà phê từ Châu Phi.',
    priceCents: 2600,
    stock: 28,
    image: 'https://todaywegrind.com/products/coffee10.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Ấn Độ Monsoon Malabar',
    description:
      'Cà phê Robusta phơi gió mùa độc đáo từ vùng Kerala, Ấn Độ. Độ chua cực thấp, đậm đà với thoảng hương gia vị và da thuộc.',
    priceCents: 1700,
    stock: 38,
    image: 'https://todaywegrind.com/products/coffee11.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Indonesia Sumatra',
    description:
      'Cà phê Robusta Sumatra chế biến ướt với nốt hương thảo mộc sâu lắng và đậm vị đất. Dòng cà phê đặc trưng của Đông Nam Á.',
    priceCents: 1550,
    stock: 42,
    image: 'https://todaywegrind.com/products/coffee12.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Guatemala Huehuetenango',
    description:
      'Cà phê Arabica vùng cao Guatemala với nốt hương sô-cô-la, gia vị và cam quýt. Cân bằng hoàn hảo giữa độ chua và độ đậm đà.',
    priceCents: 2100,
    stock: 36,
    image: 'https://todaywegrind.com/products/coffee13.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Costa Rica Tarrazú',
    description:
      'Cà phê Arabica thung lũng Tarrazú với vị ngọt caramel, sô-cô-la và cam quýt dịu nhẹ. Độ chua cân bằng, hậu vị mượt mà.',
    priceCents: 2050,
    stock: 41,
    image: 'https://todaywegrind.com/products/coffee14.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Tây Nguyên',
    description:
      'Cà phê Robusta nguyên bản từ thủ phủ cà phê Việt Nam. Đậm vị đất, thoảng nốt hương thuốc lá và sô-cô-la đen.',
    priceCents: 1450,
    stock: 65,
    image: 'https://todaywegrind.com/products/coffee15.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Panama Geisha',
    description:
      'Cà phê Geisha Panama phiên bản giới hạn với hương hoa phức hợp, nốt hương nhài và hậu vị trái cây nhiệt đới ngọt ngào.',
    priceCents: 3800,
    stock: 10,
    image: 'https://todaywegrind.com/products/coffee16.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Peru Hữu Cơ Thương Mại Công Bằng',
    description:
      'Cà phê Arabica Peru đạt chứng nhận hữu cơ quốc tế. Hương vị cân bằng giữa sô-cô-la, hạt dẻ và trái cây chín.',
    priceCents: 1950,
    stock: 44,
    image: 'https://todaywegrind.com/products/coffee17.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Uganda Bugisu',
    description:
      'Cà phê Robusta Đông Phi với vị đậm đà, nốt gia vị cay nhẹ và hậu vị đất. Sự lựa chọn mạnh mẽ cho những ai tìm kiếm sự cá tính.',
    priceCents: 1650,
    stock: 39,
    image: 'https://todaywegrind.com/products/coffee18.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Tanzania Kilimanjaro',
    description:
      'Được trồng trên sườn núi Kilimanjaro hùng vĩ, dòng Arabica này mang lại độ chua sáng như rượu vang cùng hương vị trái cây phong phú.',
    priceCents: 2300,
    stock: 33,
    image: 'https://todaywegrind.com/products/coffee19.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Mexico Oaxaca',
    description:
      'Cà phê Arabica vùng cao Mexico với nốt hương gia vị nhẹ nhàng, vị ngọt sô-cô-la và độ chua vừa phải. Dễ uống và thơm ngon.',
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
