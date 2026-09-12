-- DESTRUCTIVE if any profile has already chosen 'IBPS RRB': Postgres has no ALTER TYPE ... DROP VALUE,
-- so removing it means rebuilding the enum, and any row using the value is reassigned to 'IBPS PO' first.

UPDATE public.profiles SET exam_board = 'IBPS PO' WHERE exam_board = 'IBPS RRB';

CREATE TYPE public.exam_board_old AS ENUM ('IBPS PO', 'IBPS Clerk', 'SBI PO', 'SBI Clerk', 'RBI Grade B');
ALTER TABLE public.profiles ALTER COLUMN exam_board DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN exam_board TYPE public.exam_board_old
  USING exam_board::text::public.exam_board_old;
ALTER TABLE public.profiles ALTER COLUMN exam_board SET DEFAULT 'IBPS PO';
DROP TYPE public.exam_board;
ALTER TYPE public.exam_board_old RENAME TO exam_board;
