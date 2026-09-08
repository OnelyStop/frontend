-- Down for 0003_doubt_replies.
-- DESTRUCTIVE: dropping the table takes every reply on every doubt with it.
-- The threads themselves survive; only the discussion on them is lost.
DROP TABLE IF EXISTS "doubt_replies";
