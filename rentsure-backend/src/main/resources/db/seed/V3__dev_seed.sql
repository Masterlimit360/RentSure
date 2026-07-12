-- V3 Dev Seed Data
-- This migration ONLY runs in the dev profile to seed the local database for offline work.
-- It will NEVER be applied to Supabase prod.

-- Insert dummy users if they don't exist
INSERT INTO users (id, full_name, email, phone, role, password_hash, is_verified_email, status, created_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Dev Tenant', 'tenant@dev.com', '0550000001', 'TENANT', 'dummy_hash', true, 'ACTIVE', NOW()),
('22222222-2222-2222-2222-222222222222', 'Dev Landlord', 'landlord@dev.com', '0550000002', 'LANDLORD', 'dummy_hash', true, 'ACTIVE', NOW())
ON CONFLICT (email) DO NOTHING;

-- You can add properties, bookings, etc. as needed for local testing.
