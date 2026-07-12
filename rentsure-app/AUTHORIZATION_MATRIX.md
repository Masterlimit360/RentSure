# RentSure Authorization Matrix (Supabase RLS)

All table access in RentSure is governed strictly by PostgreSQL Row Level Security (RLS) policies. Every table has RLS enabled, meaning by default, no data is accessible to any client.

## Table: public.profiles
- **SELECT**: Everyone (Public viewable)
- **INSERT**: `auth.users` Trigger ONLY (via Postgres)
- **UPDATE**: Authenticated users can update their own rows (excluding `role` and `status` which are controlled by Edge Functions).
- **DELETE**: None.

## Table: public.properties
- **SELECT**: Everyone can view if `status = 'AVAILABLE'`. Landlords can view their own properties regardless of status.
- **INSERT**: Authenticated users can insert properties where `landlord_id = auth.uid()`.
- **UPDATE**: Landlords can update their own properties.
- **DELETE**: None (Soft delete via setting status to `HIDDEN`).

## Table: public.property_media
- **SELECT**: Everyone.
- **INSERT**: Landlords can insert media if they own the related property.
- **UPDATE**: None.
- **DELETE**: Landlords can delete media if they own the related property.

## Table: public.bookings
- **SELECT**: Tenants can view their own bookings. Landlords can view bookings for properties they own.
- **INSERT**: None (Direct inserts rejected). Handled strictly by `create_booking` RPC.
- **UPDATE**: None (Direct updates rejected). State transitions handled by `accept_booking`, `reject_booking`, `confirm_move_in` RPCs and Edge Functions.
- **DELETE**: None.

## Table: public.payments
- **SELECT**: The Tenant who made the booking and the Landlord who owns the property.
- **INSERT / UPDATE**: None (Edge Functions / Webhooks only, using Service Role).

## Table: public.agreements
- **SELECT**: The Tenant and the Landlord involved in the booking.
- **INSERT / UPDATE**: None (Edge Functions only).

## Table: public.reviews
- **SELECT**: Everyone (Public).
- **INSERT**: The Tenant or Landlord involved in the booking, ONLY IF the booking status is `MOVED_IN` or `COMPLETED`.
- **UPDATE / DELETE**: None.

## Table: public.notifications
- **SELECT**: User can view their own notifications (`user_id = auth.uid()`).
- **INSERT**: Handled strictly by Postgres triggers/RPCs (e.g., when a booking is created).
- **UPDATE**: User can update `is_read` on their own notifications.
- **DELETE**: None.

## Table: public.verifications
- **SELECT**: Users can view their own verifications. Admins can view all.
- **INSERT**: Users can insert their own.
- **UPDATE**: Edge Functions only (Admin verifications).
- **DELETE**: None.

## Table: public.payout_accounts
- **SELECT**: Landlords can view their own payout accounts.
- **INSERT / UPDATE / DELETE**: Landlords can manage their own payout accounts.
