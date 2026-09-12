CREATE TYPE "employee_role" AS ENUM('staff', 'admin');
--> statement-breakpoint
CREATE TYPE "employee_status" AS ENUM('active', 'inactive', 'banned');
--> statement-breakpoint
CREATE TYPE "customer_status" AS ENUM('active', 'inactive', 'banned');
--> statement-breakpoint
CREATE TYPE "auth_account_type" AS ENUM('employee', 'customer');
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company_email" text NOT NULL,
	"department" text,
	"password_hash" text,
	"role" "employee_role" DEFAULT 'staff'::"employee_role" NOT NULL,
	"status" "employee_status" DEFAULT 'active'::"employee_status" NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"password_hash" text,
	"status" "customer_status" DEFAULT 'active'::"customer_status" NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "employees_company_email_lower_idx" ON "employees" (lower("company_email"));
--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_lower_idx" ON "customers" (lower("email"));
--> statement-breakpoint
ALTER TABLE "auth_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_user_id_users_id_fkey";
--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD COLUMN "account_type" "auth_account_type";
--> statement-breakpoint
UPDATE "auth_tokens" SET "account_type" = 'employee';
--> statement-breakpoint
ALTER TABLE "auth_tokens" ALTER COLUMN "account_type" SET NOT NULL;
--> statement-breakpoint
DROP TABLE "users";
--> statement-breakpoint
DROP TYPE "user_role";
--> statement-breakpoint
DROP TYPE "user_status";
