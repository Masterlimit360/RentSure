/**
 * Agreements API endpoints.
 *
 * A digital rental agreement is auto-created when a booking reaches PAID_ESCROW.
 * Both the tenant and landlord must sign before move-in — the UI blocks the
 * "Confirm Move-in" action until both signatures are present.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/agreements.mock';
import type { ApiResponse, SignAgreementRequest } from '@/types';
import type { Agreement } from '@/types';

/**
 * Fetch the agreement for a specific booking.
 * Preconditions: booking must be in PAID_ESCROW state or later.
 * @throws AGREEMENT_NOT_FOUND if no agreement exists for this booking yet.
 */
export async function getAgreement(bookingId: string): Promise<ApiResponse<Agreement>> {
  if (USE_MOCKS) return mocks.mockGetAgreement(bookingId);
  const response = await apiClient.get<ApiResponse<Agreement>>(`/agreements/${bookingId}`);
  return response.data;
}

/**
 * Sign the agreement for a booking.
 * Preconditions: Caller must be a party to the booking (tenant or landlord).
 * Each party can only sign once — duplicate calls return ALREADY_SIGNED.
 * @throws AGREEMENT_NOT_FOUND if no agreement exists.
 * @throws ALREADY_SIGNED if this party has already signed.
 */
export async function signAgreement(
  bookingId: string,
  req: SignAgreementRequest
): Promise<ApiResponse<Agreement>> {
  if (USE_MOCKS) return mocks.mockSignAgreement(bookingId, req);
  const response = await apiClient.post<ApiResponse<Agreement>>(
    `/agreements/${bookingId}/sign`,
    req
  );
  return response.data;
}
