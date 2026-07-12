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
