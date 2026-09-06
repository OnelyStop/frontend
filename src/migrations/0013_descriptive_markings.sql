CREATE TABLE "descriptive_markings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" text NOT NULL,
	"answer" text NOT NULL,
	"words" integer NOT NULL,
	"total" numeric(5, 2) NOT NULL,
	"out_of" numeric(5, 2) NOT NULL,
	"marking" jsonb NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "descriptive_markings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "descriptive_markings_user_idx" ON "descriptive_markings" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE POLICY "signed-in users can read their own markings" ON "descriptive_markings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "descriptive_markings"."user_id");--> statement-breakpoint
ALTER TABLE "descriptive_markings" ADD CONSTRAINT "descriptive_markings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
-- Postgres checks GRANTs before RLS, so the policy above never runs without this.
-- SELECT only: a marking is written by the route that paid for it, never by a client.
GRANT SELECT ON public.descriptive_markings TO authenticated;
