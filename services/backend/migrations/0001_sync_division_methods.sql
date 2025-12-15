-- step 1: convert columns to text
ALTER TABLE "receipt_items" ALTER COLUMN "suggested_split_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "split_item_participants" ALTER COLUMN "division_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "split_items" ALTER COLUMN "default_division_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "split_items" ALTER COLUMN "default_division_method" DROP DEFAULT;--> statement-breakpoint

-- step 2: map old values to new ones in receipt_items
UPDATE "receipt_items" SET "suggested_split_method" = 'by_fraction' WHERE "suggested_split_method" = 'equal';--> statement-breakpoint
UPDATE "receipt_items" SET "suggested_split_method" = 'by_fraction' WHERE "suggested_split_method" = 'shares';--> statement-breakpoint
UPDATE "receipt_items" SET "suggested_split_method" = 'by_amount' WHERE "suggested_split_method" = 'fixed';--> statement-breakpoint
UPDATE "receipt_items" SET "suggested_split_method" = 'by_fraction' WHERE "suggested_split_method" = 'proportional';--> statement-breakpoint

-- step 3: map old values to new ones in split_item_participants
UPDATE "split_item_participants" SET "division_method" = 'by_fraction' WHERE "division_method" = 'equal';--> statement-breakpoint
UPDATE "split_item_participants" SET "division_method" = 'by_fraction' WHERE "division_method" = 'shares';--> statement-breakpoint
UPDATE "split_item_participants" SET "division_method" = 'by_amount' WHERE "division_method" = 'fixed';--> statement-breakpoint
UPDATE "split_item_participants" SET "division_method" = 'by_fraction' WHERE "division_method" = 'proportional';--> statement-breakpoint

-- step 4: map old values to new ones in split_items
UPDATE "split_items" SET "default_division_method" = 'by_fraction' WHERE "default_division_method" = 'equal';--> statement-breakpoint
UPDATE "split_items" SET "default_division_method" = 'by_fraction' WHERE "default_division_method" = 'shares';--> statement-breakpoint
UPDATE "split_items" SET "default_division_method" = 'by_amount' WHERE "default_division_method" = 'fixed';--> statement-breakpoint
UPDATE "split_items" SET "default_division_method" = 'by_fraction' WHERE "default_division_method" = 'proportional';--> statement-breakpoint

-- step 5: drop old enum and create new one
DROP TYPE "public"."division_method";--> statement-breakpoint
CREATE TYPE "public"."division_method" AS ENUM('by_fraction', 'by_amount', 'per_unit', 'custom');--> statement-breakpoint

-- step 6: convert columns back to new enum
ALTER TABLE "receipt_items" ALTER COLUMN "suggested_split_method" SET DATA TYPE "public"."division_method" USING "suggested_split_method"::"public"."division_method";--> statement-breakpoint
ALTER TABLE "split_item_participants" ALTER COLUMN "division_method" SET DATA TYPE "public"."division_method" USING "division_method"::"public"."division_method";--> statement-breakpoint
ALTER TABLE "split_items" ALTER COLUMN "default_division_method" SET DATA TYPE "public"."division_method" USING "default_division_method"::"public"."division_method";--> statement-breakpoint
ALTER TABLE "split_items" ALTER COLUMN "default_division_method" SET DEFAULT 'by_fraction'::"public"."division_method";
