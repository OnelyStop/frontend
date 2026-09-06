DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "chat_conversations" CASCADE;--> statement-breakpoint
-- Added by hand in 0003 for the tutor's block retrieval. Drizzle never tracked
-- the column, so it is dropped by hand too.
DROP INDEX "content_blocks_search_idx";--> statement-breakpoint
ALTER TABLE "content_blocks" DROP COLUMN "search_vector";
