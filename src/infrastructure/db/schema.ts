import { sql } from 'drizzle-orm';
import {
  check,
  date,
  halfvec,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { env } from '../../config/env.ts';
import { ORDER_STATUSES } from '../../domain/order/order.entity.ts';
import {
  REVIEW_CATEGORIES,
  REVIEW_REPLY_AUTHOR_TYPES,
  REVIEW_SENTIMENTS,
  REVIEW_SEVERITIES,
  REVIEW_SOURCES,
  REVIEW_STATUSES,
} from '../../domain/order-review/order-review.entity.ts';
import { CURRENCIES } from '../../domain/shared/currency.ts';
import { USER_ROLES, USER_STATUSES } from '../../domain/user/user.entity.ts';

export const userRole = pgEnum('user_role', USER_ROLES);
export const userStatus = pgEnum('user_status', USER_STATUSES);

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
    failedLoginAttempts: integer().notNull().default(0),
    lockedUntil: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [uniqueIndex('users_email_lower_idx').on(sql`lower(${t.email})`)],
);

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('auth_tokens_user_id_idx').on(t.userId)],
);

export const orderStatus = pgEnum('order_status', ORDER_STATUSES);
export const currency = pgEnum('currency', CURRENCIES);

export const products = pgTable(
  'products',
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull(),
    name: text().notNull(),
    description: text(),
    imageUrl: text(),
    embedding: halfvec({ dimensions: env.EMBEDDING_DIMENSION }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    uniqueIndex('products_slug_idx').on(t.slug),
    index('products_created_at_idx').on(t.createdAt.desc()),
    index('products_embedding_hnsw_idx').using(
      'hnsw',
      t.embedding.op('halfvec_cosine_ops'),
    ),
  ],
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text().notNull(),
    priceCents: integer().notNull(),
    currency: currency().notNull().default('VND'),
    stock: integer().notNull().default(0),
    expiresAt: date(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    uniqueIndex('product_variants_sku_idx').on(t.sku),
    index('product_variants_product_id_idx').on(t.productId),
    check('product_variants_price_cents_nonneg', sql`${t.priceCents} >= 0`),
    check('product_variants_stock_nonneg', sql`${t.stock} >= 0`),
  ],
);

export const propertyDataType = pgEnum('property_data_type', [
  'text',
  'number',
  'enum',
]);

export const productProperties = pgTable(
  'product_properties',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    dataType: propertyDataType().notNull().default('text'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_properties_name_lower_idx').on(sql`lower(${t.name})`),
  ],
);

export const productVariantPropertyValues = pgTable(
  'product_variant_property_values',
  {
    id: uuid().primaryKey().defaultRandom(),
    productVariantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    productPropertyId: uuid()
      .notNull()
      .references(() => productProperties.id, { onDelete: 'cascade' }),
    value: text().notNull(),
  },
  (t) => [
    index('product_variant_property_values_variant_id_idx').on(
      t.productVariantId,
    ),
    index('product_variant_property_values_property_id_idx').on(
      t.productPropertyId,
    ),
    uniqueIndex('product_variant_property_values_unique_idx').on(
      t.productVariantId,
      t.productPropertyId,
    ),
  ],
);

export const productCategories = pgTable(
  'product_categories',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    parentId: uuid(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('product_categories_parent_id_idx').on(t.parentId)],
);

export const productsCategories = pgTable(
  'products_categories',
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    productCategoryId: uuid()
      .notNull()
      .references(() => productCategories.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('products_categories_unique_idx').on(
      t.productId,
      t.productCategoryId,
    ),
    index('products_categories_category_id_idx').on(t.productCategoryId),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    customerEmail: text().notNull(),
    status: orderStatus().notNull().default('pending'),
    totalCents: integer().notNull(),
    currency: currency().notNull().default('VND'),
    cashReceivedCents: integer(),
    changeCents: integer(),
    shippingFullName: text(),
    shippingAddress: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index('orders_customer_email_created_at_idx').on(
      t.customerEmail,
      t.createdAt.desc(),
    ),
    index('orders_status_created_at_idx').on(t.status, t.createdAt.desc()),
    index('orders_created_at_idx').on(t.createdAt.desc()),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productVariantId: uuid().references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    productName: text().notNull(),
    variantSku: text(),
    variantPropertyValues: jsonb().$type<
      Array<{ propertyName: string; value: string }>
    >(),
    priceCents: integer().notNull(),
    quantity: integer().notNull(),
  },
  (t) => [index('order_items_order_id_idx').on(t.orderId)],
);

export const orderReviewSource = pgEnum('order_review_source', REVIEW_SOURCES);
export const orderReviewCategory = pgEnum('order_review_category', REVIEW_CATEGORIES);
export const orderReviewSeverity = pgEnum('order_review_severity', REVIEW_SEVERITIES);
export const orderReviewSentiment = pgEnum('order_review_sentiment', REVIEW_SENTIMENTS);
export const orderReviewStatus = pgEnum('order_review_status', REVIEW_STATUSES);

export const orderReviews = pgTable(
  'order_reviews',
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid().references(() => products.id, { onDelete: 'set null' }),
    orderId: uuid().references(() => orders.id, { onDelete: 'set null' }),
    customerEmail: text(),
    rating: integer(),
    commentText: text().notNull(),
    source: orderReviewSource().notNull().default('app'),
    category: orderReviewCategory(),
    severity: orderReviewSeverity(),
    sentiment: orderReviewSentiment(),
    topics: jsonb().$type<string[]>(),
    suggestedResponse: text(),
    classificationRaw: jsonb(),
    classifiedAt: timestamp({ withTimezone: true }),
    status: orderReviewStatus().notNull().default('pending_classification'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index('order_reviews_product_id_idx').on(t.productId),
    index('order_reviews_status_created_at_idx').on(t.status, t.createdAt.desc()),
    index('order_reviews_severity_idx').on(t.severity),
    check('order_reviews_rating_range', sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

export const orderReviewReplyAuthorType = pgEnum(
  'order_review_reply_author_type',
  REVIEW_REPLY_AUTHOR_TYPES,
);

export const orderReviewReplies = pgTable(
  'order_review_replies',
  {
    id: uuid().primaryKey().defaultRandom(),
    reviewId: uuid()
      .notNull()
      .references(() => orderReviews.id, { onDelete: 'cascade' }),
    authorType: orderReviewReplyAuthorType().notNull(),
    authorName: text(),
    replyText: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('order_review_replies_review_id_idx').on(t.reviewId)],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
export type OrderReviewRow = typeof orderReviews.$inferSelect;
export type NewOrderReviewRow = typeof orderReviews.$inferInsert;
export type OrderReviewReplyRow = typeof orderReviewReplies.$inferSelect;
export type NewOrderReviewReplyRow = typeof orderReviewReplies.$inferInsert;
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type AuthTokenRow = typeof authTokens.$inferSelect;
export type NewAuthTokenRow = typeof authTokens.$inferInsert;
export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductVariantRow = typeof productVariants.$inferSelect;
export type NewProductVariantRow = typeof productVariants.$inferInsert;
export type ProductPropertyRow = typeof productProperties.$inferSelect;
export type NewProductPropertyRow = typeof productProperties.$inferInsert;
export type ProductVariantPropertyValueRow =
  typeof productVariantPropertyValues.$inferSelect;
export type NewProductVariantPropertyValueRow =
  typeof productVariantPropertyValues.$inferInsert;
export type ProductCategoryRow = typeof productCategories.$inferSelect;
export type NewProductCategoryRow = typeof productCategories.$inferInsert;
export type ProductsCategoryRow = typeof productsCategories.$inferSelect;
export type NewProductsCategoryRow = typeof productsCategories.$inferInsert;
