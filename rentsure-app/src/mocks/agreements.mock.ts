/**
 * Mock agreement endpoints.
 *
 * Agreements are auto-created server-side when a booking transitions to PAID_ESCROW.
 * In mocks, we pre-seed agreements for existing PAID_ESCROW+ bookings in store.ts.
 * Both the tenant and landlord must sign before move-in can be confirmed.
 *
 * IMPORTANT: In production, the PDF is generated server-side and stored on S3.
 * The mock uses a placeholder URL — never open this URL expecting a real document.
 */

import { db, flushDb } from './store';
import { generateId, simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import type { ApiResponse, SignAgreementRequest } from '@/types';
import type { Agreement } from '@/types';

/**
 * Fetch the agreement for a booking.
 * @throws AGREEMENT_NOT_FOUND if no agreement has been created yet.
 */
export async function mockGetAgreement(bookingId: string): Promise<ApiResponse<Agreement>> {
  await simulateLatency();

  const agreement = db.agreements.find((a) => a.bookingId === bookingId);
  if (!agreement) {
    return wrapError('AGREEMENT_NOT_FOUND', 'No agreement found for this booking');
  }

  return wrapResponse(agreement);
}

/**
 * Sign the agreement for a booking.
 * Sets `tenantSignedAt` or `landlordSignedAt` depending on the caller's role.
 *
 * IMPORTANT: Once signed, a signature cannot be revoked. This mirrors real
 * e-signature law — do not add an "unsign" endpoint without legal review.
 *
 * @throws AGREEMENT_NOT_FOUND if no agreement exists.
 * @throws ALREADY_SIGNED if this role has already signed.
 */
export async function mockSignAgreement(
  bookingId: string,
  req: SignAgreementRequest
): Promise<ApiResponse<Agreement>> {
  await simulateLatency();

  const agreement = db.agreements.find((a) => a.bookingId === bookingId);
  if (!agreement) {
    // Auto-create the agreement if the booking is in PAID_ESCROW+ and one doesn't exist yet
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) return wrapError('BOOKING_NOT_FOUND', 'Booking not found');

    const eligibleStatuses = ['PAID_ESCROW', 'MOVED_IN', 'COMPLETED'];
    if (!eligibleStatuses.includes(booking.status)) {
      return wrapError('INVALID_STATE', 'Agreement can only be signed after payment is received');
    }

    const newAgreement: Agreement = {
      id: generateId(),
      bookingId,
      pdfUrl: `https://rentsure.com/mock-agreements/${bookingId}.pdf`,
    };
    db.agreements.push(newAgreement);
    return mockSignAgreement(bookingId, req); // recurse with the newly created agreement
  }

  if (req.role === 'TENANT') {
    if (agreement.tenantSignedAt) {
      return wrapError('ALREADY_SIGNED', 'You have already signed this agreement');
    }
    agreement.tenantSignedAt = new Date().toISOString();
  } else {
    if (agreement.landlordSignedAt) {
      return wrapError('ALREADY_SIGNED', 'You have already signed this agreement');
    }
    agreement.landlordSignedAt = new Date().toISOString();
  }

  await flushDb();
  return wrapResponse(agreement);
}
