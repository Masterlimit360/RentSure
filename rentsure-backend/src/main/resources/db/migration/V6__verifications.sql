-- V6 Verifications
-- Stores identity and property verification requests and documents

CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    entity_type VARCHAR(20) CHECK (entity_type IN ('USER', 'PROPERTY')) NOT NULL,
    entity_id UUID NOT NULL, -- The ID of the user or property being verified
    document_url TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING' NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX idx_verifications_entity ON verifications(entity_type, entity_id);
