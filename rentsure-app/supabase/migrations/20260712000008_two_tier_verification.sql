-- Two-Tier Verification Migration

-- 1. Trigger to enforce verification rules
CREATE OR REPLACE FUNCTION public.check_verification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_profile_verified BOOLEAN;
BEGIN
    SELECT is_verified INTO v_profile_verified FROM public.profiles WHERE id = NEW.landlord_id;

    IF NEW.property_id IS NOT NULL THEN
        -- Property Verification
        IF NOT v_profile_verified THEN
            RAISE EXCEPTION 'FORBIDDEN: identity verification required first';
        END IF;
        IF NEW.doc_type NOT IN ('LAND_TITLE', 'UTILITY_BILL') THEN
            RAISE EXCEPTION 'INVALID_DOC_TYPE: Property verification requires LAND_TITLE or UTILITY_BILL';
        END IF;
    ELSE
        -- Identity Verification
        IF v_profile_verified THEN
            RAISE EXCEPTION 'INVALID_STATE: identity already verified';
        END IF;
        IF NEW.doc_type != 'GHANA_CARD' THEN
            RAISE EXCEPTION 'INVALID_DOC_TYPE: Identity verification requires GHANA_CARD';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_verification_rules ON public.verifications;
CREATE TRIGGER enforce_verification_rules
    BEFORE INSERT ON public.verifications
    FOR EACH ROW EXECUTE FUNCTION public.check_verification_insert();

-- 2. Update admin_verify RPC
CREATE OR REPLACE FUNCTION public.admin_verify(p_verification_id UUID, p_approve BOOLEAN, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_verification public.verifications;
    v_status VARCHAR(20);
    v_property_title TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access required';
    END IF;

    SELECT * INTO v_verification FROM public.verifications WHERE id = p_verification_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Verification not found';
    END IF;

    IF v_verification.status != 'PENDING' THEN
         RAISE EXCEPTION 'Verification already decided';
    END IF;
    
    IF NOT p_approve AND (p_reason IS NULL OR trim(p_reason) = '') THEN
        RAISE EXCEPTION 'Rejection requires a reason';
    END IF;

    v_status := CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END;

    UPDATE public.verifications 
    SET status = v_status, rejection_reason = p_reason, updated_at = NOW() 
    WHERE id = p_verification_id;

    IF p_approve THEN
        IF v_verification.property_id IS NOT NULL THEN
            UPDATE public.properties SET is_verified = true WHERE id = v_verification.property_id;
        ELSE
            UPDATE public.profiles SET is_verified = true WHERE id = v_verification.landlord_id;
            -- We no longer update properties here!
        END IF;
    END IF;

    IF v_verification.property_id IS NOT NULL THEN
        SELECT title INTO v_property_title FROM public.properties WHERE id = v_verification.property_id;
        INSERT INTO public.notifications (user_id, type, title, body)
        VALUES (
            v_verification.landlord_id, 
            'VERIFICATION_' || v_status, 
            'Property Verification ' || v_status, 
            'Your property ' || v_property_title || ' verification has been ' || lower(v_status) || CASE WHEN NOT p_approve THEN '. Reason: ' || p_reason ELSE '.' END
        );
    ELSE
        INSERT INTO public.notifications (user_id, type, title, body)
        VALUES (
            v_verification.landlord_id, 
            'VERIFICATION_' || v_status, 
            'Identity Verification ' || v_status, 
            'Your identity verification has been ' || lower(v_status) || CASE WHEN NOT p_approve THEN '. Reason: ' || p_reason ELSE '.' END
        );
    END IF;
END;
$$;

-- 3. Update RLS policy for verifications
DROP POLICY IF EXISTS "Users can insert own verifications" ON public.verifications;
CREATE POLICY "Users can insert own verifications" ON public.verifications
FOR INSERT WITH CHECK (
  landlord_id = auth.uid()
  AND (property_id IS NULL OR EXISTS (
    SELECT 1 FROM public.properties WHERE id = verifications.property_id AND landlord_id = auth.uid()
  ))
);

-- 4. One-time data audit
-- Reset properties.is_verified if it was erroneously set by an identity approval.
UPDATE public.properties SET is_verified = false
WHERE is_verified = true
AND NOT EXISTS (
  SELECT 1 FROM public.verifications v 
  WHERE v.property_id = properties.id 
  AND v.status = 'APPROVED'
);
