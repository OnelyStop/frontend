CREATE TABLE "doubt_stuck" (
	"doubt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doubt_stuck_doubt_id_user_id_pk" PRIMARY KEY("doubt_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "doubt_stuck" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "doubts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"section" "exam_section" NOT NULL,
	"topic" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"stuck_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doubts_title_len_check" CHECK (char_length("doubts"."title") between 10 and 160),
	CONSTRAINT "doubts_body_len_check" CHECK (char_length("doubts"."body") between 20 and 4000)
);
--> statement-breakpoint
ALTER TABLE "doubts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "doubt_stuck" ADD CONSTRAINT "doubt_stuck_doubt_id_doubts_id_fk" FOREIGN KEY ("doubt_id") REFERENCES "public"."doubts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubt_stuck" ADD CONSTRAINT "doubt_stuck_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubts" ADD CONSTRAINT "doubts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doubt_stuck_user_idx" ON "doubt_stuck" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "doubts_stuck_idx" ON "doubts" USING btree ("section","stuck_count" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "doubts_created_idx" ON "doubts" USING btree ("section","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "doubts_author_idx" ON "doubts" USING btree ("author_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE POLICY "signed-in users can read stuck marks" ON "doubt_stuck" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can mark themselves stuck" ON "doubt_stuck" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "doubt_stuck"."user_id");--> statement-breakpoint
CREATE POLICY "signed-in users can clear their own stuck mark" ON "doubt_stuck" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "doubt_stuck"."user_id");--> statement-breakpoint
CREATE POLICY "signed-in users can read every doubt" ON "doubts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed-in users can post their own doubts" ON "doubts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "doubts"."author_id");--> statement-breakpoint
-- Postgres checks table GRANTs before RLS, so without these the policies above
-- never run and every query comes back empty.
GRANT SELECT, INSERT ON public.doubts TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON public.doubt_stuck TO authenticated;