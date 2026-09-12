ALTER TABLE "orders" ADD COLUMN "shipping_full_name" text;
--> statement-breakpoint
UPDATE "orders" SET "shipping_full_name" = NULLIF(trim(concat_ws(' ', "shipping_first_name", "shipping_last_name")), '');
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_first_name";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_last_name";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_city";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping_postal_code";
