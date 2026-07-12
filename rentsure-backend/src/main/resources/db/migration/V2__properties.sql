CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    property_type VARCHAR(50) CHECK (property_type IN ('SINGLE_ROOM', 'SELF_CONTAINED', 'APARTMENT', 'HOUSE')) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    gps_lat DECIMAL(9,6),
    gps_lng DECIMAL(9,6),
    price_per_year NUMERIC(12,2) CHECK (price_per_year > 0) NOT NULL,
    bedrooms SMALLINT NOT NULL,
    bathrooms SMALLINT NOT NULL,
    amenities JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    status VARCHAR(20) CHECK (status IN ('AVAILABLE', 'RENTED', 'HIDDEN')) DEFAULT 'AVAILABLE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    media_type VARCHAR(10) CHECK (media_type IN ('PHOTO', 'VIDEO')) NOT NULL,
    url TEXT NOT NULL,
    sort_order SMALLINT NOT NULL
);

-- Partial index for search queries
CREATE INDEX idx_properties_search ON properties(city, property_type, price_per_year) WHERE status = 'AVAILABLE';
