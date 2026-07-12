# QA Checklist

This checklist documents the critical end-to-end user flows in RentSure. Use this guide to manually test features and verify state transitions across the Tenant, Landlord, and Admin apps.

---

## 1. Tenant App

### Authentication & Profile
- [ ] **Register:** Can create a new tenant account.
- [ ] **Login:** Can login with credentials.
- [ ] **Edit Profile:** Can edit `fullName` and `phone` from the inline profile editor.
- [ ] **Logout:** Correctly clears auth state and redirects to login.

### Search & Browse
- [ ] **Home Screen:** Displays the welcome message and available properties.
- [ ] **Search:** Can type in the search bar and filter properties.
- [ ] **Categories:** Tapping a category (e.g., "Apartment") filters the list correctly.
- [ ] **Property Details:** Tapping a property opens the detail view with images, price, and description.

### Booking Flow
- [ ] **Initiate Request:** Tenant can tap "Request to Book" on an available property.
- [ ] **My Bookings:** The requested property appears in the "My Bookings" tab with `REQUESTED` status.
- [ ] **Landlord Approval:** (Requires testing in Landlord App) Once approved, status should change to `ACCEPTED`.

### Payments & Move-in
- [ ] **Pay Rent:** When booking is `ACCEPTED`, tenant can tap "Pay Rent" (simulated via Paystack).
- [ ] **Escrow:** After payment, status changes to `PAID_ESCROW`.
- [ ] **Confirm Move-in:** Tenant can tap "Confirm Move-in" once they occupy the property.
- [ ] **Completion:** Status changes to `COMPLETED` and escrow is `RELEASED` to landlord.

### Notifications
- [ ] **Receive Notifications:** Tenant gets notifications when a booking is accepted.
- [ ] **Clear All:** Tenant can tap "Clear All" to dismiss all notifications.

---

## 2. Landlord App

### Authentication & Profile
- [ ] **Register/Login:** Functions identically to the tenant flow.
- [ ] **Profile Settings:** Landlords can edit their profile info and view their billing history.

### Verification (Phase 1)
- [ ] **Unverified Banner:** New landlords see the "Account not verified" banner in their profile.
- [ ] **Submit Documents:** Landlord can upload a document image (simulated) and submit for verification.
- [ ] **Pending State:** Banner updates to "Verification Pending".
- [ ] **Verified Status:** Once approved by Admin, the banner disappears.

### Property Management
- [ ] **Add Property:** Landlords can create a new property listing with details and upload an image.
- [ ] **My Properties:** The new listing appears in the "My Properties" tab.

### Booking Requests
- [ ] **View Requests:** Landlord sees incoming booking requests in the "Requests" tab with tenant details.
- [ ] **Approve/Reject:** Landlord can accept or decline a request.
- [ ] **Booking Details:** Landlord can view detailed information about a specific booking, including tenant contact info.

---

## 3. Admin App

### Dashboard
- [ ] **Overview Stats:** Admin sees total users, pending verifications, landlords, and tenants.

### Verification Queue
- [ ] **List Verifications:** Admin can view all pending verification requests from landlords.
- [ ] **Review Document:** Admin can open a modal to view the submitted document.
- [ ] **Approve/Reject:** Approving a document grants the landlord a verified status and updates their properties.

### Users Directory
- [ ] **List Users:** Admin can see a list of all tenants and landlords.
- [ ] **Suspend User:** Admin can suspend an active user.
- [ ] **Reactivate User:** Admin can reactivate a suspended user.
- [ ] **Protection:** Admin cannot suspend another admin account.

---

## 4. Edge Cases & Offline Testing

- [ ] **Network Error States:** Disabling the network should trigger offline banners or retry buttons.
- [ ] **Invalid State Transitions:** Attempting to pay for a booking that isn't `ACCEPTED` should fail.
- [ ] **Data Hydration:** N+1 queries shouldn't occur; lists should correctly populate `propertyTitle` and `tenantName`.
