TRUNCATE TABLE "order_review_replies", "order_reviews";
--> statement-breakpoint
ALTER TABLE "order_reviews" RENAME TO "product_reviews";
--> statement-breakpoint
ALTER TABLE "order_review_replies" RENAME TO "product_review_replies";
--> statement-breakpoint
ALTER TYPE "order_review_source" RENAME TO "product_review_source";
--> statement-breakpoint
ALTER TYPE "order_review_category" RENAME TO "product_review_category";
--> statement-breakpoint
ALTER TYPE "order_review_severity" RENAME TO "product_review_severity";
--> statement-breakpoint
ALTER TYPE "order_review_sentiment" RENAME TO "product_review_sentiment";
--> statement-breakpoint
ALTER TYPE "order_review_status" RENAME TO "product_review_status";
--> statement-breakpoint
ALTER TYPE "order_review_reply_author_type" RENAME TO "product_review_reply_author_type";
--> statement-breakpoint
ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "order_reviews_order_id_orders_id_fkey";
--> statement-breakpoint
ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "order_reviews_product_id_products_id_fkey";
--> statement-breakpoint
ALTER TABLE "product_reviews" DROP COLUMN "order_id";
--> statement-breakpoint
ALTER TABLE "product_reviews" ALTER COLUMN "product_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "product_reviews" ALTER COLUMN "customer_email" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "customer_id" uuid;
--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "product_review_replies" ADD COLUMN "customer_id" uuid;
--> statement-breakpoint
ALTER TABLE "product_review_replies" ADD CONSTRAINT "product_review_replies_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER INDEX "order_reviews_product_id_idx" RENAME TO "product_reviews_product_id_idx";
--> statement-breakpoint
ALTER INDEX "order_reviews_status_created_at_idx" RENAME TO "product_reviews_status_created_at_idx";
--> statement-breakpoint
ALTER INDEX "order_reviews_severity_idx" RENAME TO "product_reviews_severity_idx";
--> statement-breakpoint
ALTER INDEX "order_review_replies_review_id_idx" RENAME TO "product_review_replies_review_id_idx";
--> statement-breakpoint
ALTER TABLE "product_reviews" RENAME CONSTRAINT "order_reviews_rating_range" TO "product_reviews_rating_range";
