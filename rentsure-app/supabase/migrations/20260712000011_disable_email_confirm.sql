-- NOTE: Disabling email confirmation cannot be done via SQL on Supabase Cloud.
-- You MUST turn it off in the Dashboard:
--   Authentication → Settings → Email → toggle "Confirm email" OFF
--
-- This migration only auto-confirms any existing unconfirmed users
-- so they are not blocked from signing in.

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
