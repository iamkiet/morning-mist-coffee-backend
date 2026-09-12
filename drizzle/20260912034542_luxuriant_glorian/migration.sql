CREATE TYPE "order_review_category" AS ENUM('complaint', 'compliment', 'suggestion', 'spam');--> statement-breakpoint
CREATE TYPE "order_review_sentiment" AS ENUM('positive', 'negative', 'neutral');--> statement-breakpoint
CREATE TYPE "order_review_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "order_review_source" AS ENUM('app', 'google', 'facebook', 'form');--> statement-breakpoint
CREATE TYPE "order_review_status" AS ENUM('pending_classification', 'pending_review', 'auto_responded', 'escalated', 'resolved');--> statement-breakpoint
CREATE TABLE "order_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid,
	"order_id" uuid,
	"customer_email" text,
	"rating" integer,
	"comment_text" text NOT NULL,
	"source" "order_review_source" DEFAULT 'app'::"order_review_source" NOT NULL,
	"category" "order_review_category",
	"severity" "order_review_severity",
	"sentiment" "order_review_sentiment",
	"topics" jsonb,
	"suggested_response" text,
	"classification_raw" jsonb,
	"classified_at" timestamp with time zone,
	"status" "order_review_status" DEFAULT 'pending_classification'::"order_review_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE INDEX "order_reviews_product_id_idx" ON "order_reviews" ("product_id");--> statement-breakpoint
CREATE INDEX "order_reviews_status_created_at_idx" ON "order_reviews" ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_reviews_severity_idx" ON "order_reviews" ("severity");--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "order_reviews_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_reviews" ADD CONSTRAINT "order_reviews_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL;