-- DESTRUCTIVE: the forward migration overwrote every profile's exam_board with
-- 'Banking'. The specific board each learner had chosen is gone and this cannot
-- bring it back — everyone lands on the default. Restore from a backup instead if
-- those choices matter.
--
-- Rebuilds the six-label enum and the trigger's old fallback, so the column and
-- handle_new_user accept the same values they did before 0009.
ALTER TABLE "profiles" ALTER COLUMN "exam_board" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "exam_board" TYPE text USING "exam_board"::text;--> statement-breakpoint
UPDATE "profiles" SET "exam_board" = 'IBPS PO';--> statement-breakpoint
DROP TYPE "public"."exam_board";--> statement-breakpoint
CREATE TYPE "public"."exam_board" AS ENUM('IBPS PO', 'IBPS Clerk', 'IBPS RRB', 'SBI PO', 'SBI Clerk', 'RBI Grade B');--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "exam_board" TYPE "public"."exam_board" USING "exam_board"::"public"."exam_board";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "exam_board" SET DEFAULT 'IBPS PO';--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  meta_board text := NEW.raw_user_meta_data ->> 'exam_board';
  meta_year  text := NEW.raw_user_meta_data ->> 'target_year';
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar, exam_board, target_year)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name',
                         NEW.raw_user_meta_data ->> 'name', '')), ''),
    NULLIF(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'avatar', '')
                     FROM '^[a-z]{2,16}$'), ''),
    COALESCE(
      (SELECT e FROM UNNEST(ENUM_RANGE(NULL::public.exam_board)) AS e
        WHERE e::text = meta_board),
      'IBPS PO'::public.exam_board
    ),
    CASE
      WHEN meta_year ~ '^[0-9]{4}$' AND meta_year::int BETWEEN 2000 AND 2100
        THEN meta_year::int
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
