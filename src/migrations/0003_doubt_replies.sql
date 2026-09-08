CREATE TABLE "doubt_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doubt_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doubt_replies_body_len_check" CHECK (char_length("doubt_replies"."body") between 2 and 4000)
);
--> statement-breakpoint
ALTER TABLE "doubt_replies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "doubt_replies" ADD CONSTRAINT "doubt_replies_doubt_id_doubts_id_fk" FOREIGN KEY ("doubt_id") REFERENCES "public"."doubts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubt_replies" ADD CONSTRAINT "doubt_replies_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doubt_replies_thread_idx" ON "doubt_replies" USING btree ("doubt_id","created_at","id");--> statement-breakpoint
CREATE POLICY "signed-in users can read every reply" ON "doubt_replies" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can post their own replies" ON "doubt_replies" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "doubt_replies"."author_id");