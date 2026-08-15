ALTER TABLE "refresh_tokens" RENAME TO "auth_tokens";--> statement-breakpoint
ALTER TABLE "order_items" RENAME COLUMN "name" TO "product_name";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "email" TO "customer_email";--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "image" TO "image_url";--> statement-breakpoint
ALTER INDEX "orders_email_created_at_idx" RENAME TO "orders_customer_email_created_at_idx";--> statement-breakpoint
DROP INDEX "refresh_tokens_user_id_idx";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_sku" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_property_values" jsonb;--> statement-breakpoint
CREATE INDEX "auth_tokens_user_id_idx" ON "auth_tokens" ("user_id");--> statement-breakpoint
UPDATE "order_items" SET "product_variant_id" = NULL WHERE "product_variant_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "product_variants" WHERE "product_variants"."id" = "order_items"."product_variant_id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_variant_id_product_variants_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL;