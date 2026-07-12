-- ============================================================
-- Migration: Fix is_admin() + backfill public.profiles
-- ============================================================
--
-- IMPORTANT: Direct INSERT into auth.users is BANNED.
-- GoTrue does not accept externally-hashed passwords written via SQL.
-- Any row in auth.users whose encrypted_password was not written by
-- GoTrue itself will return HTTP 500 on sign-in.
--
-- Demo accounts MUST be created via:
--   - Supabase Dashboard → Authentication → Users → Add User (auto-confirm)
--   - OR the seed script: scripts/seed-auth-users.js  (calls admin API)
--
-- This migration only handles the public.* side:
--   1. Hardens is_admin() so it never throws
--   2. Backfills public.profiles for any auth.users rows that are missing one
-- ============================================================

-- 1. Harden is_admin() — must never raise, even when called with auth.uid() = NULL
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  v_uid UUID;
BEGIN
  BEGIN
    v_uid := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_uid AND role = 'ADMIN'
  );
END;
$$;

-- 2. Backfill public.profiles for any auth.users that are missing a profile row.
--    This fixes the case where the on_auth_user_created trigger failed during
--    a previous seeding attempt.
DO $$
DECLARE
  u record;
  v_role VARCHAR(20);
BEGIN
  FOR u IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE email IN ('tenant@rentsure.com', 'landlord@rentsure.com', 'admin@rentsure.com')
      AND id NOT IN (SELECT id FROM public.profiles)
  LOOP
    IF u.email = 'admin@rentsure.com' THEN
      v_role := 'ADMIN';
    ELSIF u.email = 'landlord@rentsure.com' THEN
      v_role := 'LANDLORD';
    ELSE
      v_role := 'TENANT';
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, role, is_verified)
    VALUES (
      u.id,
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
      -- Use a unique fake phone to avoid UNIQUE constraint collisions
      '+2330' || lpad((floor(random() * 900000000) + 100000000)::text, 9, '0'),
      v_role,
      true
    )
    ON CONFLICT (id) DO UPDATE
      SET role        = EXCLUDED.role,
          is_verified = true;
  END LOOP;
END;
$$;

-- 3. Confirm and un-ban any of the demo users that might be banned or unconfirmed.
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  banned_until       = NULL
WHERE email IN ('tenant@rentsure.com', 'landlord@rentsure.com', 'admin@rentsure.com');
