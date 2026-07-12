-- RPCs for Business Logic
-- 1. Create Booking
CREATE OR REPLACE FUNCTION public.create_booking(
    p_property_id UUID,
    p_move_in_date DATE,
    p_duration_months SMALLINT
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_property RECORD;
    v_active_bookings INT;
    v_booking_ref VARCHAR(20);
    v_total_amount NUMERIC(12,2);
    v_booking public.bookings;
BEGIN
    v_tenant_id := auth.uid();
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate property
    SELECT * INTO v_property FROM public.properties WHERE id = p_property_id FOR SHARE;
    IF NOT FOUND OR v_property.status != 'AVAILABLE' THEN
        RAISE EXCEPTION 'Property not available';
    END IF;

    -- Check for duplicate active booking
    SELECT COUNT(*) INTO v_active_bookings FROM public.bookings
    WHERE property_id = p_property_id AND tenant_id = v_tenant_id
    AND status IN ('REQUESTED', 'ACCEPTED', 'PAID_ESCROW', 'MOVED_IN');
    IF v_active_bookings > 0 THEN
        RAISE EXCEPTION 'You already have an active booking for this property';
    END IF;

    -- Compute total amount (price_per_year / 12 * duration_months)
    v_total_amount := ROUND((v_property.price_per_year / 12.0) * p_duration_months, 2);

    -- Generate reference
    v_booking_ref := 'RS-' || upper(substr(md5(random()::text), 1, 6));

    -- Insert booking
    INSERT INTO public.bookings (
        property_id, tenant_id, status, move_in_date, duration_months, total_amount, booking_ref
    ) VALUES (
        p_property_id, v_tenant_id, 'REQUESTED', p_move_in_date, p_duration_months, v_total_amount, v_booking_ref
    ) RETURNING * INTO v_booking;

    -- Generate notification for landlord
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (v_property.landlord_id, 'BOOKING_REQUESTED', 'New Booking Request', 'You have a new booking request for ' || v_property.title);

    RETURN v_booking;
END;
$$;

-- 2. Accept Booking
CREATE OR REPLACE FUNCTION public.accept_booking(p_booking_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_landlord_id UUID;
    v_booking public.bookings;
    v_property public.properties;
BEGIN
    v_landlord_id := auth.uid();
    
    SELECT b.* INTO v_booking FROM public.bookings b WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    SELECT * INTO v_property FROM public.properties WHERE id = v_booking.property_id;
    IF v_property.landlord_id != v_landlord_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Status validation is handled by trigger, just update
    UPDATE public.bookings SET status = 'ACCEPTED' WHERE id = p_booking_id RETURNING * INTO v_booking;

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (v_booking.tenant_id, 'BOOKING_ACCEPTED', 'Booking Accepted', 'Your booking for ' || v_property.title || ' was accepted. Please pay the escrow.');

    RETURN v_booking;
END;
$$;

-- 3. Reject Booking
CREATE OR REPLACE FUNCTION public.reject_booking(p_booking_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_landlord_id UUID;
    v_booking public.bookings;
    v_property public.properties;
BEGIN
    v_landlord_id := auth.uid();
    
    SELECT b.* INTO v_booking FROM public.bookings b WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    SELECT * INTO v_property FROM public.properties WHERE id = v_booking.property_id;
    IF v_property.landlord_id != v_landlord_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE public.bookings SET status = 'REJECTED' WHERE id = p_booking_id RETURNING * INTO v_booking;

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (v_booking.tenant_id, 'BOOKING_REJECTED', 'Booking Rejected', 'Your booking for ' || v_property.title || ' was rejected.');

    RETURN v_booking;
END;
$$;

-- 4. Confirm Move In
CREATE OR REPLACE FUNCTION public.confirm_move_in(p_booking_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_booking public.bookings;
    v_property public.properties;
BEGIN
    v_tenant_id := auth.uid();
    
    SELECT b.* INTO v_booking FROM public.bookings b WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_booking.tenant_id != v_tenant_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE public.bookings SET status = 'MOVED_IN' WHERE id = p_booking_id RETURNING * INTO v_booking;

    -- Flip payment to RELEASED
    UPDATE public.payments SET escrow_status = 'RELEASED', released_at = NOW() WHERE booking_id = p_booking_id;

    SELECT * INTO v_property FROM public.properties WHERE id = v_booking.property_id;

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (v_property.landlord_id, 'TENANT_MOVED_IN', 'Tenant Moved In', 'The tenant has confirmed move-in for ' || v_property.title || '. Funds will be released soon.');

    RETURN v_booking;
END;
$$;

-- 5. is_admin Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- 6. admin_verify
CREATE OR REPLACE FUNCTION public.admin_verify(p_verification_id UUID, p_approve BOOLEAN, p_notes TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_verification public.verifications;
    v_status VARCHAR(20);
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access required';
    END IF;

    SELECT * INTO v_verification FROM public.verifications WHERE id = p_verification_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Verification not found';
    END IF;

    v_status := CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END;

    UPDATE public.verifications 
    SET status = v_status, rejection_reason = p_notes, updated_at = NOW() 
    WHERE id = p_verification_id;

    IF p_approve THEN
        IF v_verification.property_id IS NOT NULL THEN
            UPDATE public.properties SET is_verified = true WHERE id = v_verification.property_id;
        ELSE
            UPDATE public.profiles SET is_verified = true WHERE id = v_verification.landlord_id;
            UPDATE public.properties SET is_verified = true WHERE landlord_id = v_verification.landlord_id;
        END IF;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
        v_verification.landlord_id, 
        'VERIFICATION_' || v_status, 
        'Verification ' || v_status, 
        'Your verification request has been ' || lower(v_status) || '.'
    );
END;
$$;

-- 7. expire_stale_bookings
CREATE OR REPLACE FUNCTION public.expire_stale_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Bookings in ACCEPTED state for > 72 hours without payment
    UPDATE public.bookings 
    SET status = 'EXPIRED', updated_at = NOW() 
    WHERE status = 'ACCEPTED' 
    AND updated_at < NOW() - INTERVAL '72 hours';
END;
$$;

-- 8. Protect Profile Columns Trigger
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger AS $$
BEGIN
    IF NOT public.is_admin() THEN
        NEW.role = OLD.role;
        NEW.status = OLD.status;
        NEW.is_verified = OLD.is_verified;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_protection ON public.profiles;
CREATE TRIGGER enforce_profile_protection
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- 9. Protect Property Columns Trigger
CREATE OR REPLACE FUNCTION public.protect_property_columns()
RETURNS trigger AS $$
BEGIN
    IF NOT public.is_admin() THEN
        NEW.is_verified = OLD.is_verified;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_property_protection ON public.properties;
CREATE TRIGGER enforce_property_protection
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.protect_property_columns();

-- 10. Cancel Booking
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id UUID
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tenant_id UUID;
    v_booking public.bookings;
    v_property public.properties;
BEGIN
    v_tenant_id := auth.uid();
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Verify the caller is the tenant
    IF v_booking.tenant_id != v_tenant_id THEN
        RAISE EXCEPTION 'Forbidden: Only the tenant can cancel this booking';
    END IF;

    -- Only allow cancellation before payment is locked in escrow
    IF v_booking.status NOT IN ('REQUESTED', 'ACCEPTED') THEN
        RAISE EXCEPTION 'Booking cannot be cancelled in % state', v_booking.status;
    END IF;

    -- Fetch property for landlord notification
    SELECT * INTO v_property FROM public.properties WHERE id = v_booking.property_id;

    -- Update booking status
    UPDATE public.bookings 
    SET status = 'CANCELLED', updated_at = NOW() 
    WHERE id = p_booking_id 
    RETURNING * INTO v_booking;

    -- Notify landlord
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
        v_property.landlord_id, 
        'BOOKING_CANCELLED', 
        'Booking Cancelled', 
        'The tenant has cancelled the booking for ' || v_property.title || '.'
    );

    RETURN v_booking;
END;
$$;

-- 10. Schedule expire_stale_bookings using pg_cron (runs every hour)
-- Note: pg_cron extension must be enabled in Supabase Dashboard (Database -> Extensions)
-- We use a DO block to safely schedule it if the extension exists.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'expire-stale-bookings',
            '0 * * * *', -- Every hour
            $$SELECT public.expire_stale_bookings()$$
        );
    END IF;
END $$;
