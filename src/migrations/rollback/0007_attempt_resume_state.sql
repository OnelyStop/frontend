-- DESTRUCTIVE: drops the paused position of every in-progress mock. A user resuming after
-- this runs starts that paper over rather than picking up where they left off.

ALTER TABLE public.attempts DROP COLUMN IF EXISTS current_section;
ALTER TABLE public.attempts DROP COLUMN IF EXISTS locked_sections;
ALTER TABLE public.attempts DROP COLUMN IF EXISTS section_remaining_ms;
