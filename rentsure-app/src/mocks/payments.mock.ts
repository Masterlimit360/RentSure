/**
 * Mock payment endpoints.
 *
 * Simulates Paystack payment initialization and status checks.
 * In the real system, initializePayment calls Paystack's API to create
 * a transaction and returns a checkout URL. Here we fake it with a
 * deterministic URL so the UI flow can be tested end-to-end.
 */

import { db, flushDb } from './store';
import { generateId, simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import type {
  ApiResponse,
  InitializePaymentResponse,
  PaymentStatusResponse,
} from '@/types';
import type { Payment } from '@/types';

/**
 * Initialize a Paystack payment for a booking.
 * Precondition: booking must be in ACCEPTED state (tenant has been approved
 * but hasn't paid yet).
 *
 * Returns a fake checkout URL. In production, this URL points to Paystack's
 * hosted payment page. The webhook handler (server-side only) confirms
 * payment and transitions the booking to PAID_ESCROW.
 *
 * We also immediately create the Payment record and transition the booking
 * to PAID_ESCROW here in mocks, since there's no real webhook to do it.
 *
 * @throws BOOKING_NOT_FOUND if booking doesn't exist.
 * @throws INVALID_STATE if booking isn't in ACCEPTED state.
 */
export async function mockInitializePayment(
  bookingId: string
): Promise<ApiResponse<InitializePaymentResponse>> {
  await simulateLatency();

  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return wrapError('BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status !== 'ACCEPTED') {
    return wrapError(
      'INVALID_STATE',
      `Cannot initialize payment for a booking in ${booking.status} state`
    );
  }

  const paystackRef = `PSK-MOCK-${Date.now()}`;

  /*
   * In mocks we return a local route for the in-app Paystack sandbox.
   * The actual creation of the Payment record is deferred until the user
   * clicks "Pay" inside the sandbox (which calls mockPayBooking).
   */
  return wrapResponse({
    checkoutUrl: `/(tenant)/sandbox/paystack?bookingId=${bookingId}&ref=${paystackRef}`,
    paystackRef,
  });
}

/**
 * Get the payment status for a booking.
 * @throws PAYMENT_NOT_FOUND if no payment exists for this booking.
 */
export async function mockGetPaymentStatus(
  bookingId: string
): Promise<ApiResponse<PaymentStatusResponse>> {
  await simulateLatency();

  const payment = db.payments.find((p) => p.bookingId === bookingId);
  if (!payment) {
    return wrapError('PAYMENT_NOT_FOUND', 'No payment found for this booking');
  }

  return wrapResponse({
    bookingId: payment.bookingId,
    amount: payment.amount,
    escrowStatus: payment.escrowStatus,
    paidAt: payment.paidAt,
    releasedAt: payment.releasedAt,
  });
}

/**
 * Get the billing history (payments) for a user.
 */
export async function mockGetBillingHistory(
  userId: string,
  role: 'TENANT' | 'LANDLORD'
): Promise<ApiResponse<Payment[]>> {
  await simulateLatency();

  // Find bookings for the user based on role
  const userBookings = db.bookings.filter(b => 
    role === 'TENANT' ? b.tenantId === userId : db.properties.find(p => p.id === b.propertyId)?.landlordId === userId
  );

  const bookingIds = new Set(userBookings.map(b => b.id));

  // Find all payments related to those bookings
  const payments = db.payments
    .filter(p => bookingIds.has(p.bookingId))
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  return wrapResponse(payments);
}

/**
 * Mocks the backend recording of a real Paystack payment.
 * Transitions booking to PAID_ESCROW and sets escrowStatus to PENDING_VERIFICATION.
 */
export async function mockRecordRealPayment(
  bookingId: string,
  amount: number,
  ref: string
): Promise<ApiResponse<{ success: boolean }>> {
  await simulateLatency();

  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return wrapError('BOOKING_NOT_FOUND', 'Booking not found');
  }

  const rent = booking.totalAmount;
  const fee = Math.round(rent * 0.05);

  // Create payment record
  const newPayment: Payment = {
    id: generateId(),
    bookingId,
    amount: rent + fee, // Store in GHS
    fee,
    escrowStatus: 'PENDING_VERIFICATION',
    paidAt: new Date().toISOString(),
    paystackRef: ref,
  };
  
  db.payments.push(newPayment);

  // Transition booking
  booking.status = 'PAID_ESCROW';

  flushDb();

  return wrapResponse({ success: true });
}
