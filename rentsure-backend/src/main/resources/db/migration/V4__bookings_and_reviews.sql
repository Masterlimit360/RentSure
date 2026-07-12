CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE RESTRICT NOT NULL,
    tenant_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'PAID_ESCROW', 'MOVED_IN', 'COMPLETED', 'CANCELLED')) NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    move_in_date DATE NOT NULL,
    duration_months SMALLINT CHECK (duration_months > 0) NOT NULL,
    total_amount NUMERIC(12,2) CHECK (total_amount > 0) NOT NULL,
    booking_ref VARCHAR(12) UNIQUE NOT NULL,
    reject_reason VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (booking_id, reviewer_id)
);
