ALTER TABLE "receipt_items" ADD COLUMN "warnings" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "split_item_groups" ADD COLUMN "warnings" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "split_items" ADD COLUMN "warnings" jsonb DEFAULT '[]';