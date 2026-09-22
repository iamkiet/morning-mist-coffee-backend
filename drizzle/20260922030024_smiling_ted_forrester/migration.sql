DROP INDEX "product_review_replies_review_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "product_review_replies_review_id_idx" ON "product_review_replies" ("review_id");