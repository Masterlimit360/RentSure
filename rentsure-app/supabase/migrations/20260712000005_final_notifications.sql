-- Final Notification Fixes for Production Verification
-- Adds RPCs for signing agreements and submitting reviews to ensure notifications
-- are created atomically in the same transaction. Also fixes the expire_stale_bookings cron.

-- 1. sign_agreement RPC
CREATE OR REPLACE FUNCTION public.sign_agreement(
    p_booking_id UUID,
    p_role VARCHAR(20)
)
RETURNS public.agreements
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_booking public.bookings;
    v_property public.properties;
    v_agreement public.agreements;
    v_other_party_id UUID;
    v_other_party_role VARCHAR(20);
    v_update_sql TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch booking and property
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    SELECT * INTO v_property FROM public.properties WHERE id = v_booking.property_id FOR SHARE;

    -- Verify permissions and determine other party
    IF p_role = 'TENANT' THEN
        IF v_booking.tenant_id != v_user_id THEN
            RAISE EXCEPTION 'Unauthorized';
        END IF;
        v_other_party_id := v_property.landlord_id;
        v_other_party_role := 'Tenant';
    ELSIF p_role = 'LANDLORD' THEN
        IF v_property.landlord_id != v_user_id THEN
            RAISE EXCEPTION 'Unauthorized';
        END IF;
        v_other_party_id := v_booking.tenant_id;
        v_other_party_role := 'Landlord';
    ELSE
        RAISE EXCEPTION 'Invalid role';
    END IF;

    -- Update the agreement
    IF p_role = 'TENANT' THEN
        UPDATE public.agreements 
        SET tenant_signed_at = NOW(), updated_at = NOW() 
        WHERE booking_id = p_booking_id 
        RETURNING * INTO v_agreement;
    ELSE
        UPDATE public.agreements 
        SET landlord_signed_at = NOW(), updated_at = NOW() 
        WHERE booking_id = p_booking_id 
        RETURNING * INTO v_agreement;
    END IF;

    -- Create notification atomically
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
        v_other_party_id, 
        'AGREEMENT_SIGNED', 
        'Agreement Signed', 
        'The ' || v_other_party_role || ' has signed the tenancy agreement for ' || v_property.title || '.'
    );

    RETURN v_agreement;
END;
$$;

-- 2. submit_review RPC
CREATE OR REPLACE FUNCTION public.submit_review(
    p_booking_id UUID,
    p_reviewee_id UUID,
    p_rating SMALLINT,
    p_comment TEXT
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_reviewer_id UUID;
    v_booking public.bookings;
    v_review public.reviews;
BEGIN
    v_reviewer_id := auth.uid();
    IF v_reviewer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Basic validation
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Invalid rating';
    END IF;

    -- Insert review
    INSERT INTO public.reviews (
        booking_id, reviewer_id, reviewee_id, rating, comment
    ) VALUES (
        p_booking_id, v_reviewer_id, p_reviewee_id, p_rating, p_comment
    ) RETURNING * INTO v_review;

    -- Create notification atomically
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
        p_reviewee_id, 
        'REVIEW_RECEIVED', 
        'New Review', 
        'You received a ' || p_rating || '-star review.'
    );

    RETURN v_review;
END;
$$;

-- 3. Modify expire_stale_bookings to include notifications
CREATE OR REPLACE FUNCTION public.expire_stale_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Loop through bookings that are expiring to insert individual notifications
    FOR v_booking IN 
        SELECT b.id, b.tenant_id, p.title 
        FROM public.bookings b
        JOIN public.properties p ON b.property_id = p.id
        WHERE b.status = 'ACCEPTED' AND b.updated_at < NOW() - INTERVAL '72 hours'
    LOOP
        -- Update booking status
        UPDATE public.bookings 
        SET status = 'EXPIRED', updated_at = NOW() 
        WHERE id = v_booking.id;

        -- Create notification for tenant
        INSERT INTO public.notifications (user_id, type, title, body)
        VALUES (
            v_booking.tenant_id, 
            'BOOKING_EXPIRED', 
            'Booking Expired', 
            'Your booking for ' || v_booking.title || ' has expired because the escrow payment window lapsed.'
        );
    END LOOP;
END;
$$;
