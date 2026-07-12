# RentSure Integration Report — Phase FINAL

## Architecture
```
React Native (Expo) → supabase-js → Supabase (Postgres + Auth + Storage + Edge Functions)
```
No custom API server. No Spring Boot. No axios.

## Mode Switch Audit

| Criteria | Status |
|---|---|
| `USE_MOCKS` driven by `EXPO_PUBLIC_USE_MOCKS` env var | ✅ |
| Live mode: zero imports from `src/mocks/` are executed | ✅ (guarded by `if (USE_MOCKS)` at top of every function) |
| Live mode: no `AsyncStorage` persistence for mock data | ✅ (mock store never initialized) |
| Live mode: no `apiClient` (axios) calls | ✅ (axios removed from client.ts) |
| Mock mode: full offline demo with CSV mirror | ✅ (unchanged) |
| DevMenu: mock actions hidden in live mode | ✅ |
| DevMenu: "Log Out & Clear Cache" in live mode | ✅ (signs out of Supabase + clears TanStack cache) |

## API File Audit

Every `src/api/*.api.ts` file follows the same pattern:
```typescript
export async function doThing(...): Promise<ApiResponse<T>> {
  if (USE_MOCKS) return mocks.mockDoThing(...);
  // supabase-js call
}
```

| File | Mock Guard | Supabase Implementation | Contract Match |
|---|---|---|---|
| `auth.api.ts` | ✅ | `supabase.auth.*` | ✅ |
| `properties.api.ts` | ✅ | `supabase.from('properties')` | ✅ |
| `bookings.api.ts` | ✅ | `supabase.rpc('create_booking')` etc. | ✅ |
| `payments.api.ts` | ✅ | `supabase.functions.invoke('paystack-init')` | ✅ |
| `agreements.api.ts` | ✅ | `supabase.from('agreements')` | ✅ |
| `reviews.api.ts` | ✅ | `supabase.from('reviews')` | ✅ |
| `notifications.api.ts` | ✅ | `supabase.from('notifications')` | ✅ |
| `verifications.api.ts` | ✅ | `supabase.functions.invoke('admin-verify')` | ✅ |
| `admin.api.ts` | ✅ | `supabase.from('profiles')` | ✅ |

## Contract Compliance (Supabase Schema Updates)

The API contract (`src/types/entities.ts`) is treated as law. The Supabase Postgres schema and Edge Functions were updated to perfectly match the TS interfaces without relying on frontend mappers to bridge structural mismatches:
- `reviews`: Column `target_id` renamed to `reviewee_id`
- `verifications`: Generic polymorphic columns `user_id`/`entity_type`/`entity_id` dropped in favor of specific `landlord_id`, `property_id`, `doc_type`, and `doc_url` columns.
- `bookings`: Dropped non-existent `reject_reason` from schema and RPCs.
- `paystack-init` Edge Function: Now returns `paystackRef` instead of `reference`.

## Payment Flow (Live Mode)

1. Tenant taps "Pay Now" on an ACCEPTED booking.
2. `initializePayment(bookingId)` calls the `paystack-init` Edge Function.
3. Edge Function creates a PENDING payment row in Supabase and calls Paystack API.
4. Frontend receives `{ checkoutUrl, paystackRef }`.
5. `WebBrowser.openBrowserAsync(checkoutUrl)` opens the Paystack checkout page.
6. On callback, frontend starts polling `getPaymentStatus(bookingId)` every 3 seconds.
7. Paystack sends webhook to `paystack-webhook` Edge Function.
8. Edge Function verifies HMAC-SHA512 signature, flips payment to HELD, booking to PAID_ESCROW.
9. Frontend poll picks up HELD status → advances to receipt screen.

## Security Checklist

| Item | Status |
|---|---|
| Only `EXPO_PUBLIC_SUPABASE_ANON_KEY` in app bundle | ✅ |
| Service-role key only in Edge Function env | ✅ |
| RLS enabled on every table | ✅ (10/10 tables) |
| Booking state machine enforced by DB trigger | ✅ |
| Paystack webhook verifies HMAC-SHA512 | ✅ |
| No direct INSERT/UPDATE on bookings (RPCs only) | ✅ |

## Known Limitations (Free Tier)

- Supabase free tier pauses after ~1 week of inactivity.
- HikariCP-style connection limits: Supabase free tier has limited connections.
- Edge Functions cold start: first invocation after idle may take 2-3 seconds.
