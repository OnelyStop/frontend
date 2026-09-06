CREATE TABLE "ai_usage" (
	"user_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"day" date NOT NULL,
	"calls" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_usage_user_id_feature_day_pk" PRIMARY KEY("user_id","feature","day")
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "ai_usage_user_day_idx" ON "ai_usage" USING btree ("user_id","day");--> statement-breakpoint
CREATE POLICY "signed-in users can read their own usage" ON "ai_usage" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "ai_usage"."user_id");--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;--> statement-breakpoint
-- Postgres checks GRANTs before RLS, so the policy above never runs without this.
GRANT SELECT ON public.ai_usage TO authenticated;
