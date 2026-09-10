-- Down for 0005_signup_exam: restores the 0002 trigger body.
-- Not destructive — profiles already written keep their exam_board and target_year;
-- only new signups stop carrying onboarding's answers into the row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name',
                         NEW.raw_user_meta_data ->> 'name', '')), ''),
    NULLIF(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'avatar', '')
                     FROM '^[a-z]{2,16}$'), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
