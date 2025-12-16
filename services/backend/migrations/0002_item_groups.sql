CREATE TYPE "public"."item_group_type" AS ENUM('receipt', 'manual', 'custom');--> statement-breakpoint
CREATE TABLE "split_item_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"receipt_id" uuid,
	"type" "item_group_type" DEFAULT 'custom' NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(64),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_collapsed" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "split_items" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "split_item_groups" ADD CONSTRAINT "fk_split_item_groups_split_id" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "split_item_groups" ADD CONSTRAINT "fk_split_item_groups_receipt_id" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_split_item_groups_split_id" ON "split_item_groups" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "idx_split_item_groups_split_active" ON "split_item_groups" USING btree ("split_id","is_deleted");--> statement-breakpoint
ALTER TABLE "split_items" ADD CONSTRAINT "fk_split_items_group_id" FOREIGN KEY ("group_id") REFERENCES "public"."split_item_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_split_items_group_id" ON "split_items" USING btree ("group_id");