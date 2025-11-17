ALTER TABLE "splits" ADD COLUMN "short_id" varchar(12) NOT NULL;--> statement-breakpoint
ALTER TABLE "splits" ADD CONSTRAINT "unique_short_id" UNIQUE("short_id");