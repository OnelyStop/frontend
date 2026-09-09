-- DESTRUCTIVE: removes the admin grant. Only this one row, and re-runnable from 0005.
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (SELECT id FROM auth.users WHERE email = 'evilden982@gmail.com');
