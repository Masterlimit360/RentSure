# RentSure Demo Script (8-Step Relay)

> **Duration:** ~5 minutes  
> **Requires:** Two accounts (Tenant + Landlord) on a real or emulated device.  
> **Mode:** Live (EXPO_PUBLIC_USE_MOCKS=false) or Mock (true) — both work.

---

## Step 1: Landlord Creates Property
1. Log in as **Landlord** (e.g. `landlord@demo.com`)
2. Tap **"Add Property"** on the dashboard
3. Fill in: Title, Description, Region/City, Price, Bedrooms, Bathrooms
4. Upload a photo
5. Tap **Submit** → Property appears on the dashboard as "AVAILABLE"

## Step 2: Tenant Searches & Requests Booking
1. Log in as **Tenant** (e.g. `tenant@demo.com`)
2. Use the **search bar** to find the property by title or city
3. Tap the property → Property detail screen with gallery
4. Tap **"Request Booking"** → Choose move-in date + duration
5. Confirm → Booking status shows **REQUESTED**

## Step 3: Landlord Accepts Booking
1. Switch to **Landlord** account
2. Tap the notification bell → "New Booking Request" notification
3. Tap the booking → Review details
4. Tap **"Accept"** → Status flips to **ACCEPTED**
5. Tenant receives a notification

## Step 4: Tenant Pays Escrow
1. Switch to **Tenant** account
2. Open the booking → Tap **"Pay Now"**
3. Review the fee breakdown (rent + 5% service fee)
4. In live mode: Paystack checkout opens in browser
5. Complete payment → Status shows **PENDING_VERIFICATION**
6. Webhook fires → Status flips to **PAID_ESCROW** (poll auto-detects)
7. Receipt screen appears

## Step 5: Agreement Signing
1. Both parties view the generated rental agreement
2. Tenant taps **"Sign"** → `tenantSignedAt` is set
3. Landlord taps **"Sign"** → `landlordSignedAt` is set
4. Both signatures required before move-in

## Step 6: Tenant Confirms Move-In
1. Switch to **Tenant**
2. Tap **"Confirm Move-In"** on the booking
3. Status flips to **MOVED_IN**
4. Escrow is released (payment.escrowStatus → RELEASED)
5. Landlord receives notification: "Funds released"

## Step 7: Leave a Review
1. On the completed booking, tap **"Leave Review"**
2. Rate 1-5 stars + comment
3. Review appears on the property detail page

## Step 8: Admin Verification (Optional)
1. Log in as **Admin**
2. View pending verifications
3. Approve or reject landlord identity/property documents
4. Approved landlords get `is_verified = true` on their profile

---

### Deny Cases to Demo (Security)
- Tenant tries to accept a booking → **Rejected by RPC** ("Unauthorized")
- Stranger queries another user's bookings → **RLS returns empty array**
- Direct SQL `UPDATE bookings SET status = 'MOVED_IN'` on REQUESTED → **Trigger rejects** ("Illegal transition")
- Uninstall app → Reinstall → Login → **All data returns from Supabase**
