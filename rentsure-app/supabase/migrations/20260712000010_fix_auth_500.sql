-- Fix is_admin to be STABLE and bulletproof against auth.uid() errors
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  v_uid UUID;
BEGIN
  -- Safely get the auth.uid()
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

-- Seed the exact test accounts into auth.users if they do not exist
-- This guarantees they will work in production without manual signup
DO $$
DECLARE
  v_pass VARCHAR := 'password123';
  v_encrypted_pass VARCHAR;
  v_tenant_id UUID := gen_random_uuid();
  v_landlord_id UUID := gen_random_uuid();
  v_admin_id UUID := gen_random_uuid();
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  v_encrypted_pass := crypt(v_pass, gen_salt('bf'));

  -- 1. Tenant
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tenant@rentsure.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_tenant_id, '00000000-0000-0000-0000-000000000000', 'tenant@rentsure.com', v_encrypted_pass, NOW(), 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}', '{"full_name": "Test Tenant", "phone": "0500000001", "role": "TENANT"}', NOW(), NOW());
  END IF;

  -- 2. Landlord
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'landlord@rentsure.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_landlord_id, '00000000-0000-0000-0000-000000000000', 'landlord@rentsure.com', v_encrypted_pass, NOW(), 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}', '{"full_name": "Test Landlord", "phone": "0500000002", "role": "LANDLORD"}', NOW(), NOW());
  END IF;

  -- 3. Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@rentsure.com') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@rentsure.com', v_encrypted_pass, NOW(), 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}', '{"full_name": "System Admin", "phone": "0500000003", "role": "ADMIN"}', NOW(), NOW());
  END IF;
END;
$$;

-- Backfill missing profiles for the test accounts (if the signup trigger failed)
DO $$
DECLARE
  u record;
  v_role VARCHAR(20);
BEGIN
  FOR u IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE email IN ('tenant@rentsure.com', 'landlord@rentsure.com', 'admin@rentsure.com')
  LOOP
    IF u.email = 'admin@rentsure.com' THEN
      v_role := 'ADMIN';
    ELSIF u.email = 'landlord@rentsure.com' THEN
      v_role := 'LANDLORD';
    ELSE
      v_role := 'TENANT';
    END IF;

    -- Insert safely, generate a fake phone if not present to avoid UNIQUE constraint violations
    -- on subsequent seeded users
    INSERT INTO public.profiles (id, full_name, phone, role, is_verified)
    VALUES (
      u.id,
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
      COALESCE(u.raw_user_meta_data->>'phone', left(gen_random_uuid()::text, 15)),
      v_role,
      true
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;
