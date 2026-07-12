-- 1. PROFILES & AUTH TRIGGER
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role VARCHAR(20) CHECK (role IN ('TENANT', 'LANDLORD', 'ADMIN')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE' NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'LANDLORD' THEN 'LANDLORD'
      ELSE 'TENANT'
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PROPERTIES
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    property_type VARCHAR(50) CHECK (property_type IN ('APARTMENT', 'HOUSE', 'ROOM', 'COMMERCIAL')) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    gps_lat DECIMAL(9,6),
    gps_lng DECIMAL(9,6),
    price_per_year NUMERIC(12,2) CHECK (price_per_year > 0) NOT NULL,
    bedrooms SMALLINT NOT NULL,
    bathrooms SMALLINT NOT NULL,
    amenities JSONB,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    status VARCHAR(20) CHECK (status IN ('AVAILABLE', 'RENTED', 'HIDDEN')) DEFAULT 'AVAILABLE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_properties_search ON public.properties (city, property_type, price_per_year) WHERE status = 'AVAILABLE';

-- 3. PROPERTY MEDIA
CREATE TABLE public.property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    media_type VARCHAR(20) CHECK (media_type IN ('PHOTO', 'VIDEO')) NOT NULL,
    url TEXT NOT NULL,
    sort_order SMALLINT DEFAULT 0 NOT NULL
);

-- 4. BOOKINGS
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT NOT NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('REQUESTED','ACCEPTED','REJECTED','EXPIRED','PAID_ESCROW','MOVED_IN','COMPLETED','CANCELLED')) NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    move_in_date DATE NOT NULL,
    duration_months SMALLINT NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    booking_ref VARCHAR(20) UNIQUE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PAYMENTS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE RESTRICT UNIQUE NOT NULL,
    paystack_ref VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(12,2) CHECK (amount > 0) NOT NULL,
    fee NUMERIC(12,2) CHECK (fee >= 0) NOT NULL,
    escrow_status VARCHAR(20) CHECK (escrow_status IN ('PENDING', 'HELD', 'RELEASED', 'REFUNDED')) NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    released_at TIMESTAMPTZ
);

-- 6. AGREEMENTS
CREATE TABLE public.agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
    pdf_url TEXT NOT NULL,
    tenant_signed_at TIMESTAMPTZ,
    landlord_signed_at TIMESTAMPTZ
);

-- 7. REVIEWS
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(booking_id, reviewer_id)
);

-- 8. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. VERIFICATIONS
CREATE TABLE public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    doc_type VARCHAR(20) CHECK (doc_type IN ('GHANA_CARD', 'LAND_TITLE', 'UTILITY_BILL')) NOT NULL,
    doc_url TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING' NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_verifications_landlord ON public.verifications(landlord_id);

-- 10. PAYOUT ACCOUNTS
CREATE TABLE public.payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(10) CHECK (type IN ('MOMO', 'BANK')) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    account_number_masked VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX idx_payout_accounts_default ON public.payout_accounts(landlord_id) WHERE is_default = true;

-- 11. BOOKING STATE MACHINE TRIGGER
CREATE OR REPLACE FUNCTION public.check_booking_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- State Machine Rules
    IF OLD.status = 'REQUESTED' AND NEW.status NOT IN ('ACCEPTED', 'REJECTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Illegal transition from REQUESTED to %', NEW.status;
    END IF;

    IF OLD.status = 'ACCEPTED' AND NEW.status NOT IN ('PAID_ESCROW', 'EXPIRED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Illegal transition from ACCEPTED to %', NEW.status;
    END IF;

    IF OLD.status = 'PAID_ESCROW' AND NEW.status NOT IN ('MOVED_IN', 'CANCELLED') THEN
        RAISE EXCEPTION 'Illegal transition from PAID_ESCROW to %', NEW.status;
    END IF;

    IF OLD.status = 'MOVED_IN' AND NEW.status NOT IN ('COMPLETED') THEN
        RAISE EXCEPTION 'Illegal transition from MOVED_IN to %', NEW.status;
    END IF;

    IF OLD.status IN ('REJECTED', 'EXPIRED', 'COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Terminal state % cannot be changed to %', OLD.status, NEW.status;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_booking_state_machine
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.check_booking_transition();
