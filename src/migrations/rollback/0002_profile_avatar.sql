-- DESTRUCTIVE: drops profiles.avatar, losing every user's chosen avatar.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_avatar_len_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar;

-- Restore the pre-avatar signup trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name',
                         NEW.raw_user_meta_data ->> 'name', '')), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

SELECT count(*) AS profiles_with_avatar_remaining
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar';
