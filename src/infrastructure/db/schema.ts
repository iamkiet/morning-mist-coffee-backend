import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['user', 'admin']);
export const userStatus = pgEnum('user_status', ['active', 'inactive', 'banned']);

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull(),
    passwordHash: text(),
    role: userRole().notNull().default('user'),
    status: userStatus().notNull().default('active'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [uniqueIndex('users_email_lower_idx').on(sql`lower(${t.email})`)],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('refresh_tokens_user_id_idx').on(t.userId)],
);

export const orderStatus = pgEnum('order_status', [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
]);

export const currency = pgEnum('currency', ['USD', 'VND']);

export const productTypes = pgTable(
  'product_types',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    uniqueIndex('product_types_name_lower_idx').on(sql`lower(${t.name})`),
  ],
);

export const products = pgTable(
  'products',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text(),
    priceCents: integer().notNull(),
    currency: currency().notNull().default('USD'),
    image: text(),
    productTypeId: uuid()
      .notNull()
      .references(() => productTypes.id, { onDelete: 'restrict' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index('products_product_type_id_created_at_idx').on(
      t.productTypeId,
      t.createdAt.desc(),
    ),
    index('products_created_at_idx').on(t.createdAt.desc()),
    check('products_price_cents_nonneg', sql`${t.priceCents} >= 0`),
  ],
);

export const productStock = pgTable(
  'product_stock',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    uniqueIndex('product_stock_product_id_idx').on(t.productId),
    check('product_stock_quantity_nonneg', sql`${t.quantity} >= 0`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull(),
    status: orderStatus().notNull().default('pending'),
    totalCents: integer().notNull(),
    currency: currency().notNull().default('USD'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index('orders_email_created_at_idx').on(t.email, t.createdAt.desc()),
    index('orders_status_created_at_idx').on(t.status, t.createdAt.desc()),
    index('orders_created_at_idx').on(t.createdAt.desc()),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type RefreshTokenRow = typeof refreshTokens.$inferSelect;
export type NewRefreshTokenRow = typeof refreshTokens.$inferInsert;
export type ProductTypeRow = typeof productTypes.$inferSelect;
export type NewProductTypeRow = typeof productTypes.$inferInsert;
export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductStockRow = typeof productStock.$inferSelect;
export type NewProductStockRow = typeof productStock.$inferInsert;
