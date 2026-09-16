-- Postgres cannot remove a value from an enum, so this rebuilds article_source
-- without the three news feeds. Any article already ingested from them is
-- deleted, along with the question generated from it.
--
-- DESTRUCTIVE: those articles and their questions are gone; re-ingesting only
-- recovers what the feeds still carry.
DELETE FROM "questions" WHERE "article_id" IN (
  SELECT "article_id" FROM "articles"
  WHERE "source" IN ('indian_express', 'business_standard', 'livemint')
);--> statement-breakpoint
DELETE FROM "articles" WHERE "source" IN ('indian_express', 'business_standard', 'livemint');--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "source" TYPE text USING "source"::text;--> statement-breakpoint
DROP TYPE "public"."article_source";--> statement-breakpoint
CREATE TYPE "public"."article_source" AS ENUM('newsdata_io', 'rbi_rss', 'pib_rss', 'sebi_rss');--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "source" TYPE "public"."article_source" USING "source"::"public"."article_source";
