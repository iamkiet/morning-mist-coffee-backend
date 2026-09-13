ALTER TABLE "product_review_replies" DROP CONSTRAINT "product_review_replies_customer_id_customers_id_fkey";--> statement-breakpoint
ALTER TABLE "product_review_replies" ALTER COLUMN "author_type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "product_review_replies" SET "author_type" = 'admin' WHERE "author_type" = 'customer';--> statement-breakpoint
DROP TYPE "product_review_reply_author_type";--> statement-breakpoint
CREATE TYPE "product_review_reply_author_type" AS ENUM('admin', 'ai');--> statement-breakpoint
ALTER TABLE "product_review_replies" ALTER COLUMN "author_type" SET DATA TYPE "product_review_reply_author_type" USING "author_type"::"product_review_reply_author_type";--> statement-breakpoint
ALTER TABLE "product_reviews" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product_reviews" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
UPDATE "product_reviews" SET "status" = 'pending_reply' WHERE "status" IN ('pending_review', 'escalated');--> statement-breakpoint
DROP TYPE "product_review_status";--> statement-breakpoint
CREATE TYPE "product_review_status" AS ENUM('pending_classification', 'pending_reply', 'auto_responded', 'resolved');--> statement-breakpoint
ALTER TABLE "product_reviews" ALTER COLUMN "status" SET DATA TYPE "product_review_status" USING "status"::"product_review_status";--> statement-breakpoint
ALTER TABLE "product_reviews" ALTER COLUMN "status" SET DEFAULT 'pending_classification'::"product_review_status";--> statement-breakpoint
ALTER TABLE "product_review_replies" DROP COLUMN "customer_id";