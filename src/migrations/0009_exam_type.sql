-- Hand-written: drizzle emits ADD VALUE for an enum, which cannot also drop the six
-- board labels this replaces, and it cannot rewrite handle_new_user. A learner now
-- picks a broad exam type; the specific board stays a property of a paper, where it
-- was always the real source of truth.
--
-- Converting the column to text first releases the type so it can be dropped and
-- recreated in the same transaction. ADD VALUE could not be used here: Postgres
-- refuses to use a newly added label in the transaction that added it.
ALTER TABLE "profiles" ALTER COLUMN "exam_board" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "exam_board" TYPE text USING "exam_board"::text;--> statement-breakpoint
-- Every existing label was a banking board, so this loses no meaning.
UPDATE "profiles" SET "exam_board" = 'Banking';--> statement-breakpoint
DROP TYPE "public"."exam_board";--> statement-breakpoint
CREATE TYPE "public"."exam_board" AS ENUM('Banking', 'NEET', 'IIT JEE');--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "exam_board" TYPE "public"."exam_board" USING "exam_board"::"public"."exam_board";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "exam_board" SET DEFAULT 'Banking';--> statement-breakpoint

-- The trigger fell back to 'IBPS PO', a label that no longer exists; without this
-- every signup would raise instead of writing a profile.
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
      'Banking'::public.exam_board
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
