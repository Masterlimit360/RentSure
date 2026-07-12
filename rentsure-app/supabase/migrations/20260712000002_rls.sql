-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read profiles. Users can update their own (except role/status).
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Properties: Anyone can read AVAILABLE. Owner reads all. Owner inserts/updates.
CREATE POLICY "Available properties are public" ON public.properties FOR SELECT USING (status = 'AVAILABLE' OR auth.uid() = landlord_id);
CREATE POLICY "Landlords can insert properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = landlord_id) WITH CHECK (auth.uid() = landlord_id);

-- Property Media: Anyone can read. Owner can insert/delete.
CREATE POLICY "Property media is public" ON public.property_media FOR SELECT USING (true);
CREATE POLICY "Landlords can insert media" ON public.property_media FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_media.property_id AND landlord_id = auth.uid())
);
CREATE POLICY "Landlords can delete media" ON public.property_media FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_media.property_id AND landlord_id = auth.uid())
);

-- Bookings: Tenant reads own. Landlord reads property's bookings. Inserts via RPC only.
CREATE POLICY "Tenants can read own bookings" ON public.bookings FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Landlords can read property bookings" ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND landlord_id = auth.uid())
);
-- No direct INSERT/UPDATE policies for bookings! Handled by RPCs.

-- Payments: Booking parties can read. Edge Functions write.
CREATE POLICY "Booking parties can read payments" ON public.payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings b 
            LEFT JOIN public.properties p ON b.property_id = p.id
            WHERE b.id = payments.booking_id AND (b.tenant_id = auth.uid() OR p.landlord_id = auth.uid()))
);

-- Agreements: Booking parties can read. Parties can update their signatures.
CREATE POLICY "Booking parties can read agreements" ON public.agreements FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings b 
            LEFT JOIN public.properties p ON b.property_id = p.id
            WHERE b.id = agreements.booking_id AND (b.tenant_id = auth.uid() OR p.landlord_id = auth.uid()))
);
CREATE POLICY "Booking parties can sign agreements" ON public.agreements FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.bookings b 
            LEFT JOIN public.properties p ON b.property_id = p.id
            WHERE b.id = agreements.booking_id AND (b.tenant_id = auth.uid() OR p.landlord_id = auth.uid()))
);

-- Reviews: Anyone can read. Booking parties can write if MOVED_IN/COMPLETED.
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Booking parties can insert reviews" ON public.reviews FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.bookings b 
        LEFT JOIN public.properties p ON b.property_id = p.id
        WHERE b.id = reviews.booking_id 
        AND b.status IN ('MOVED_IN', 'COMPLETED')
        AND (b.tenant_id = auth.uid() OR p.landlord_id = auth.uid())
    )
);

-- Notifications: User reads/updates own.
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Verifications: User reads own. Admins read all. User inserts own.
CREATE POLICY "Users can read own verifications" ON public.verifications FOR SELECT USING (landlord_id = auth.uid());
CREATE POLICY "Admins can read all verifications" ON public.verifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Users can insert own verifications" ON public.verifications FOR INSERT WITH CHECK (landlord_id = auth.uid());

-- Payout Accounts: Landlords read/write own.
CREATE POLICY "Landlords read own payout accounts" ON public.payout_accounts FOR SELECT USING (landlord_id = auth.uid());
CREATE POLICY "Landlords insert own payout accounts" ON public.payout_accounts FOR INSERT WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "Landlords update own payout accounts" ON public.payout_accounts FOR UPDATE USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());
CREATE POLICY "Landlords delete own payout accounts" ON public.payout_accounts FOR DELETE USING (landlord_id = auth.uid());
