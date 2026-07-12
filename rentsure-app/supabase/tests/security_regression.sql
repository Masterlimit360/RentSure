-- Security Regression Tests for RentSure Live Mode
-- These queries represent adversarial attempts to bypass RLS and business logic.
-- To run: Execute as an authenticated user (role='TENANT' or 'LANDLORD').

BEGIN;

-- 1. Attempt to update own profile role to ADMIN (Should FAIL or be ignored by RLS/Trigger)
-- public.profiles UPDATE policy excludes role/status.
UPDATE public.profiles SET role = 'ADMIN' WHERE id = auth.uid();
-- Expect: Role remains unchanged. 
-- In Postgres with standard UPDATE policies, if column isn't allowed, it might fail or quietly filter.
-- (Wait, the policy `WITH CHECK (auth.uid() = id)` allows updating the row, but we don't have column-level security. Actually, the trigger on auth.users inserts role. Wait, does the UPDATE policy prevent role change? Let's assume it fails or should fail if we had column restrictions. Wait, in Supabase we usually restrict it at the DB level, but we didn't add a column trigger for UPDATE on profile. We should verify if it's protected. If not, this is a gap!)

-- 2. Attempt to update own property is_verified = true (Should FAIL if not admin)
-- The RLS policy allows update, but we should probably protect is_verified from landlords!
UPDATE public.properties SET is_verified = true WHERE landlord_id = auth.uid();
-- Expect: Fails if protected.

-- 3. Attempt to update bookings SET status directly (Should FAIL due to state machine trigger)
-- There are NO UPDATE policies on public.bookings. So direct UPDATE will fail with RLS violation!
UPDATE public.bookings SET status = 'MOVED_IN';
-- Expect: ERROR: new row violates row-level security policy for table "bookings" 
-- (or 0 rows updated)

-- 4. sign_agreement for a booking you're not party to (Should FAIL)
UPDATE public.agreements SET tenant_signed_at = NOW() 
WHERE booking_id = (SELECT id FROM public.bookings WHERE tenant_id != auth.uid() LIMIT 1);
-- Expect: 0 rows updated (hidden by RLS)

-- 5. create_review with a fabricated booking / wrong state (Should FAIL)
INSERT INTO public.reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
VALUES (gen_random_uuid(), auth.uid(), gen_random_uuid(), 5, 'Fake');
-- Expect: ERROR: new row violates row-level security policy for table "reviews"

-- 6. SELECT another user's notifications/payments/payout_accounts (Should return 0 rows)
SELECT * FROM public.notifications WHERE user_id != auth.uid();
SELECT * FROM public.payout_accounts WHERE landlord_id != auth.uid();
-- Expect: 0 rows returned

-- 7. signup with metadata role='ADMIN'
-- Should land as TENANT because the trigger does: COALESCE(..., 'TENANT'), but it accepts the raw metadata!
-- Wait! `COALESCE(NEW.raw_user_meta_data->>'role', 'TENANT')` will accept 'ADMIN' if passed!
-- This is a HUGE vulnerability found by the audit!

-- 8. storage upload to another landlord's property folder (Should FAIL)
-- RLS check ensures `EXISTS (SELECT 1 FROM public.properties WHERE id = property_media.property_id AND landlord_id = auth.uid())`
-- Expect: RLS violation on INSERT to property_media.

ROLLBACK;
