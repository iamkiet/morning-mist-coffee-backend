ALTER TABLE "orders" ADD COLUMN "cash_received_cents" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "change_cents" integer;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
UPDATE "orders" SET "currency" = 'VND';--> statement-breakpoint
UPDATE "products" SET "currency" = 'VND';--> statement-breakpoint
DROP TYPE "currency";--> statement-breakpoint
CREATE TYPE "currency" AS ENUM('VND');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "currency" SET DATA TYPE "currency" USING "currency"::"currency";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'VND'::"currency";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "currency" SET DATA TYPE "currency" USING "currency"::"currency";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "currency" SET DEFAULT 'VND'::"currency";