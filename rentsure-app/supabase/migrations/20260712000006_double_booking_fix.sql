-- Fixes the Double-Booking Race condition by enforcing a hard-block in the accept_booking RPC.
-- It ensures that a property cannot have multiple bookings in ACCEPTED, PAID_ESCROW, or MOVED_IN status simultaneously.

CREATE OR REPLACE FUNCTION public.accept_booking(p_booking_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_landlord_id UUID;
    v_booking public.bookings;
    v_property public.properties;
    v_competing_count INT;
BEGIN
    v_landlord_id := auth.uid();
    
    -- Lock the booking to prevent race conditions on the same booking
    SELECT b.* INTO v_booking FROM public.bookings b WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Fetch property and verify ownership
    SELECT * INTO v_property FROM public.properties WHERE id = v_booking.property_id;
    IF v_property.landlord_id != v_landlord_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- DOUBLE-BOOKING RACE FIX: 
    -- Check if ANY other booking for this property is already ACCEPTED or beyond
    SELECT COUNT(*) INTO v_competing_count
    FROM public.bookings
    WHERE property_id = v_property.id
      AND id != p_booking_id
      AND status IN ('ACCEPTED', 'PAID_ESCROW', 'MOVED_IN');

    IF v_competing_count > 0 THEN
        RAISE EXCEPTION 'Another booking for this property is already accepted or active. You cannot accept multiple bookings simultaneously.';
    END IF;

    -- Status validation is handled by trigger, just update
    UPDATE public.bookings SET status = 'ACCEPTED' WHERE id = p_booking_id RETURNING * INTO v_booking;

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (v_booking.tenant_id, 'BOOKING_ACCEPTED', 'Booking Accepted', 'Your booking for ' || v_property.title || ' was accepted. Please pay the escrow within 72 hours.');

    RETURN v_booking;
END;
$$;
