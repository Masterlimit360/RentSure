-- Seed data for RentSure (Live Mode Testing)
-- This script creates the default mock accounts with the password 'password123'
-- It uses the pgcrypto extension to hash the password.

-- Ensure pgcrypto is enabled (needed for crypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cleanup old seed data to ensure fresh inserts work
DELETE FROM auth.users WHERE email IN ('tenant@rentsure.com', 'landlord@rentsure.com', 'admin@rentsure.com', 'tenant@rent.com', 'landlord@rent.com', 'admin@rent.com');

-- 1. Insert Tenant Account (tenant@rent.com)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'tenant@rent.com', crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"TENANT","full_name":"Demo Tenant","phone":"+233550000001"}',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'tenant@rent.com')::jsonb, 'email', 'tenant@rent.com', now(), now(), now())
ON CONFLICT DO NOTHING;

-- 2. Insert Landlord Account (landlord@rent.com)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated', 'landlord@rent.com', crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"LANDLORD","full_name":"Demo Landlord","phone":"+233550000002"}',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'landlord@rent.com')::jsonb, 'email', 'landlord@rent.com', now(), now(), now())
ON CONFLICT DO NOTHING;

-- 3. Insert Admin Account (admin@rent.com)
-- Bypasses the trigger constraint by directly inserting into profiles after the trigger runs
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated', 'admin@rent.com', crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"ADMIN","full_name":"Demo Admin","phone":"+233550000003"}',
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', format('{"sub":"%s","email":"%s"}', '33333333-3333-3333-3333-333333333333', 'admin@rent.com')::jsonb, 'email', 'admin@rent.com', now(), now(), now())
ON CONFLICT DO NOTHING;

-- Force the admin's role to be ADMIN since the trigger will downgrade it to TENANT
UPDATE public.profiles SET role = 'ADMIN' WHERE id = '33333333-3333-3333-3333-333333333333';

-- 4. Verify Landlord
UPDATE public.profiles SET is_verified = true WHERE id = '22222222-2222-2222-2222-222222222222';

-- 5. Add a default property for the landlord to receive bookings on
INSERT INTO public.properties (
  id, landlord_id, title, description, property_type, region, city, area, price_per_year, bedrooms, bathrooms, status, is_verified
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '22222222-2222-2222-2222-222222222222',
  'Luxury Studio in East Legon',
  'A beautiful studio apartment in the heart of East Legon.',
  'APARTMENT', 'Greater Accra', 'Accra', 'East Legon', 12000.00, 1, 1, 'AVAILABLE', true
) ON CONFLICT (id) DO NOTHING;

-- Add property media
INSERT INTO public.property_media (property_id, media_type, url, sort_order)
VALUES 
  ('99999999-9999-9999-9999-999999999999', 'PHOTO', 'https://nxujvinvafvfsavdlqwj.supabase.co/storage/v1/object/public/property-media/dummy-1.jpg', 0),
  ('99999999-9999-9999-9999-999999999999', 'PHOTO', 'https://nxujvinvafvfsavdlqwj.supabase.co/storage/v1/object/public/property-media/dummy-2.jpg', 1);
