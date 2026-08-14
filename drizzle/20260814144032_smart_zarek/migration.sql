CREATE TYPE "property_data_type" AS ENUM('text', 'number', 'enum');--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"data_type" "property_data_type" DEFAULT 'text'::"property_data_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant_property_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_variant_id" uuid NOT NULL,
	"product_property_id" uuid NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" "currency" DEFAULT 'VND'::"currency" NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"expires_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_price_cents_nonneg" CHECK ("price_cents" >= 0),
	CONSTRAINT "product_variants_stock_nonneg" CHECK ("stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products_categories" (
	"product_id" uuid NOT NULL,
	"product_category_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_product_type_id_product_types_id_fkey";--> statement-breakpoint
DROP TABLE "product_stock";--> statement-breakpoint
DROP TABLE "product_types";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_price_cents_nonneg";--> statement-breakpoint
DROP INDEX "products_product_type_id_created_at_idx";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "origin";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "tasting_notes";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "price_cents";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "product_type_id";--> statement-breakpoint
CREATE INDEX "product_categories_parent_id_idx" ON "product_categories" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_properties_name_lower_idx" ON "product_properties" (lower("name"));--> statement-breakpoint
CREATE INDEX "product_variant_property_values_variant_id_idx" ON "product_variant_property_values" ("product_variant_id");--> statement-breakpoint
CREATE INDEX "product_variant_property_values_property_id_idx" ON "product_variant_property_values" ("product_property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_property_values_unique_idx" ON "product_variant_property_values" ("product_variant_id","product_property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_idx" ON "product_variants" ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_categories_unique_idx" ON "products_categories" ("product_id","product_category_id");--> statement-breakpoint
CREATE INDEX "products_categories_category_id_idx" ON "products_categories" ("product_category_id");--> statement-breakpoint
ALTER TABLE "product_variant_property_values" ADD CONSTRAINT "product_variant_property_values_C3dY0UgbLP9T_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_variant_property_values" ADD CONSTRAINT "product_variant_property_values_LJGtIUIMu7Qu_fkey" FOREIGN KEY ("product_property_id") REFERENCES "product_properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products_categories" ADD CONSTRAINT "products_categories_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products_categories" ADD CONSTRAINT "products_categories_JfBCfa9tjB7v_fkey" FOREIGN KEY ("product_category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE;