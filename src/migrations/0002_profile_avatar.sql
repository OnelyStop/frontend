ALTER TABLE "profiles" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_avatar_len_check" CHECK ("profiles"."avatar" is null or char_length("profiles"."avatar") <= 32);--> statement-breakpoint

-- Hand-written: drizzle cannot emit functions, so the signup trigger is updated here.
-- The avatar arrives in user_metadata, which the user controls, so the shape is
-- constrained here and the render map is the real allowlist.
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
