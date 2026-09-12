-- DESTRUCTIVE: drops which mode every past attempt was sat under and its flag history.

ALTER TABLE public.attempts DROP COLUMN IF EXISTS exam_mode;
ALTER TABLE public.attempts DROP COLUMN IF EXISTS flag_count;
