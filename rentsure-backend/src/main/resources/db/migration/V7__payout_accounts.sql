-- V7 Payout Accounts
-- Stores payout methods for landlords (MOMO or BANK)

CREATE TABLE payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(10) CHECK (type IN ('MOMO', 'BANK')) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- e.g., 'MTN', 'VODAFONE', 'ECOBANK'
    account_number_masked VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure a landlord only has one default payout account (Optional but good practice)
CREATE UNIQUE INDEX idx_payout_accounts_default ON payout_accounts(landlord_id) WHERE is_default = true;
