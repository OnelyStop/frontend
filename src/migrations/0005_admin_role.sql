-- Numbered past 0003/0004 on design-system/canvas-language so the two branches do not collide.
-- Inserts nothing until that account exists; re-run this statement after signup.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'evilden982@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
