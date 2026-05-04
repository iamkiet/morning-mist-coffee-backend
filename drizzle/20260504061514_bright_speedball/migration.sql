DROP INDEX "orders_customer_id_created_at_idx";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "customer_id";--> statement-breakpoint
CREATE INDEX "orders_email_created_at_idx" ON "orders" ("email","created_at" DESC NULLS LAST);