CREATE TYPE "public"."division_method" AS ENUM('equal', 'shares', 'fixed', 'proportional', 'custom');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('product', 'tip', 'delivery', 'service_fee', 'tax');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('sbp', 'card', 'phone', 'bank_transfer', 'cash', 'crypto', 'custom');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'confirmed', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."split_phase" AS ENUM('setup', 'voting', 'payment', 'confirming');--> statement-breakpoint
CREATE TYPE "public"."split_status" AS ENUM('draft', 'active', 'completed');--> statement-breakpoint
CREATE TABLE "split_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "split_item_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"note" varchar(2048),
	"division_method" "division_method" NOT NULL,
	"participation_value" numeric(12, 4),
	"apply_total_discount" boolean DEFAULT true NOT NULL,
	"calculated_sum" integer,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_participant_item" UNIQUE("participant_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "split_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"type" "item_type" DEFAULT 'product' NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" varchar(2048),
	"icon" varchar(64),
	"note" varchar(2048),
	"image_url" varchar(512),
	"display_order" integer DEFAULT 0,
	"price" integer NOT NULL,
	"item_discount" integer DEFAULT '0',
	"quantity" numeric(8, 3) DEFAULT '1',
	"unit" varchar(32) DEFAULT 'piece',
	"default_division_method" "division_method" DEFAULT 'equal' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "split_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" varchar(255),
	"is_ready" boolean DEFAULT false NOT NULL,
	"has_paid" boolean DEFAULT false NOT NULL,
	"overridden_permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"invited_by" uuid,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_split_user" UNIQUE("split_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "split_payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"comment" varchar(2048),
	"is_preferred" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_split_payment_method" UNIQUE("split_id","payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "split_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"payment_method_id" uuid,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"note" varchar(2048),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_split_id" uuid,
	"owner_id" uuid NOT NULL,
	"status" "split_status" DEFAULT 'draft' NOT NULL,
	"phase" "split_phase" DEFAULT 'setup' NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(64),
	"currency" varchar(3) DEFAULT 'RUB' NOT NULL,
	"max_participants" integer,
	"expected_participants" integer,
	"total_discount" integer DEFAULT 0,
	"total_discount_percent" numeric(5, 2) DEFAULT '0',
	"default_permissions" jsonb DEFAULT '{"can_edit_items":false,"can_edit_split":false,"can_manage_members":false}'::jsonb NOT NULL,
	"payment_deadline" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"display_name" varchar(128),
	"currency" varchar(3) DEFAULT 'RUB' NOT NULL,
	"payment_data" jsonb NOT NULL,
	"is_temporary" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" integer,
	"username" varchar(100),
	"display_name" varchar(255) NOT NULL,
	"avatar_url" varchar(512),
	"preferences" jsonb DEFAULT '{}' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_telegram_id" UNIQUE("telegram_id"),
	CONSTRAINT "unique_username" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "split_audit_log" ADD CONSTRAINT "fk_split_audit_log_split_id" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_audit_log" ADD CONSTRAINT "fk_split_audit_log_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_item_participants" ADD CONSTRAINT "fk_split_item_participants_participant_id" FOREIGN KEY ("participant_id") REFERENCES "public"."split_participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_item_participants" ADD CONSTRAINT "fk_split_item_participants_item_id" FOREIGN KEY ("item_id") REFERENCES "public"."split_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_items" ADD CONSTRAINT "fk_split_items_split_id" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_participants" ADD CONSTRAINT "fk_split_participants_split_id" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_participants" ADD CONSTRAINT "fk_split_participants_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_participants" ADD CONSTRAINT "fk_split_participants_invited_by" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_payment_methods" ADD CONSTRAINT "fk_split_payment_methods_split_id" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_payment_methods" ADD CONSTRAINT "fk_split_payment_methods_payment_method_id" FOREIGN KEY ("payment_method_id") REFERENCES "public"."user_payment_methods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_payments" ADD CONSTRAINT "fk_split_payments_participant_id" FOREIGN KEY ("participant_id") REFERENCES "public"."split_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_payments" ADD CONSTRAINT "fk_split_payments_payment_method_id" FOREIGN KEY ("payment_method_id") REFERENCES "public"."user_payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "splits" ADD CONSTRAINT "fk_splits_parent_split_id" FOREIGN KEY ("parent_split_id") REFERENCES "public"."splits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "splits" ADD CONSTRAINT "fk_splits_owner_id" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_payment_methods" ADD CONSTRAINT "fk_user_payment_methods_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_split_audit_log_split_id" ON "split_audit_log" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "idx_split_audit_log_user_id" ON "split_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_split_audit_log_split_time" ON "split_audit_log" USING btree ("split_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_split_audit_log_created_at" ON "split_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_split_audit_log_cleanup" ON "split_audit_log" USING btree ("created_at","split_id");--> statement-breakpoint
CREATE INDEX "idx_split_item_participants_participant_id" ON "split_item_participants" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_split_item_participants_item_id" ON "split_item_participants" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_split_item_participants_active" ON "split_item_participants" USING btree ("participant_id","item_id","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_split_items_split_id" ON "split_items" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "idx_split_items_split_active" ON "split_items" USING btree ("split_id","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_split_items_order" ON "split_items" USING btree ("split_id","display_order","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_split_items_type" ON "split_items" USING btree ("split_id","type","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_split_participants_split_id" ON "split_participants" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "idx_split_participants_user_id" ON "split_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_split_participants_split_active" ON "split_participants" USING btree ("split_id","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_split_participants_has_paid" ON "split_participants" USING btree ("split_id","has_paid","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_split_participants_is_ready" ON "split_participants" USING btree ("split_id","is_ready","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_split_payment_methods_split_id" ON "split_payment_methods" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "idx_split_payment_methods_preferred" ON "split_payment_methods" USING btree ("split_id","is_preferred");--> statement-breakpoint
CREATE INDEX "idx_split_payments_participant_id" ON "split_payments" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_split_payments_status" ON "split_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_split_payments_pending" ON "split_payments" USING btree ("participant_id","status");--> statement-breakpoint
CREATE INDEX "idx_split_payments_created_at" ON "split_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_split_payments_old" ON "split_payments" USING btree ("created_at","status");--> statement-breakpoint
CREATE INDEX "idx_splits_owner_id" ON "splits" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_splits_status" ON "splits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_splits_phase" ON "splits" USING btree ("phase");--> statement-breakpoint
CREATE INDEX "idx_splits_owner_active" ON "splits" USING btree ("owner_id","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_splits_parent_id" ON "splits" USING btree ("parent_split_id");--> statement-breakpoint
CREATE INDEX "idx_splits_payment_deadline" ON "splits" USING btree ("payment_deadline");--> statement-breakpoint
CREATE INDEX "idx_splits_updated_at" ON "splits" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_user_payment_methods_user_id" ON "user_payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_payment_methods_active" ON "user_payment_methods" USING btree ("user_id","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_user_payment_methods_default" ON "user_payment_methods" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_user_payment_methods_temporary" ON "user_payment_methods" USING btree ("is_temporary","created_at");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_display_name" ON "users" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_users_last_seen_at" ON "users" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "users" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_users_telegram_active" ON "users" USING btree ("telegram_id","is_deleted");