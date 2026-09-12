CREATE TYPE "order_review_reply_author_type" AS ENUM('admin', 'customer', 'ai');--> statement-breakpoint
CREATE TABLE "order_review_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"review_id" uuid NOT NULL,
	"author_type" "order_review_reply_author_type" NOT NULL,
	"author_name" text,
	"reply_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "order_review_replies_review_id_idx" ON "order_review_replies" ("review_id");--> statement-breakpoint
ALTER TABLE "order_review_replies" ADD CONSTRAINT "order_review_replies_review_id_order_reviews_id_fkey" FOREIGN KEY ("review_id") REFERENCES "order_reviews"("id") ON DELETE CASCADE;