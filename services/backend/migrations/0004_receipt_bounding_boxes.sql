ALTER TABLE "receipt_items" ADD COLUMN "bbox" jsonb;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "image_metadata" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "saved_images" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "detected_language" varchar(2);