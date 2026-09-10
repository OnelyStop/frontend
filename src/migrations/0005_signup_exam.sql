-- Hand-written: drizzle cannot emit functions, so the signup trigger is updated here.
-- Onboarding asks the exam and the target year before the account exists, so both
-- arrive in user_metadata, which the user controls. They are preferences, never
-- authorization, and the shape is constrained here: a board that is not one of the
-- enum's labels leaves the column at its default, and a year outside the column's
-- own check lands null. Neither can raise, so a crafted value cannot block signup.
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
