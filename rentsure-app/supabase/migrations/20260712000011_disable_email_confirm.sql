-- Disable email confirmation requirement.
-- Users are signed in immediately after registration with any valid email.
-- No OTP or verification link is sent or required.
UPDATE auth.config
SET confirm_email_change = false
WHERE confirm_email_change = true;

-- Also auto-confirm any existing unconfirmed users so they can log in
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
