/**
 * Payments API endpoints.
 * 
 * Handles the boundary between the frontend and the real backend for payment flows.
 * 
 * IMPORTANT: The frontend NEVER verifies payments itself. It only requests
 * initialization, presents the checkout URL returned by the backend, and polls
 * this API for the final status. The backend relies exclusively on Paystack
 * webhooks to securely verify payments.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/payments.mock';
import type {
  ApiResponse,
  InitializePaymentResponse,
  PaymentStatusResponse,
} from '@/types';
import type { Payment } from '@/types';

/**
 * Initiates the payment process for a booking.
 * Returns a checkout URL (either a real Paystack URL or a mock internal route)
 * and a reference string.
 */
export async function initializePayment(
  bookingId: string
): Promise<ApiResponse<InitializePaymentResponse>> {
  if (USE_MOCKS) return mocks.mockInitializePayment(bookingId);
  const response = await apiClient.post<ApiResponse<InitializePaymentResponse>>(
    `/payments/initialize/${bookingId}`
  );
  return response.data;
}

/**
 * Polls the backend for the current status of a payment.
 * 
 * IMPORTANT: This is the ONLY way the frontend determines if a payment succeeded.
 * The backend relies on Paystack webhooks to update the status in the real database,
 * and this endpoint simply reads that status.
 */
export async function getPaymentStatus(
  bookingId: string
): Promise<ApiResponse<PaymentStatusResponse>> {
  if (USE_MOCKS) return mocks.mockGetPaymentStatus(bookingId);
  const response = await apiClient.get<ApiResponse<PaymentStatusResponse>>(
    `/payments/${bookingId}/status`
  );
  return response.data;
}

/**
 * Retrieves the billing history for a given user.
 * For tenants, this is a history of their payments.
 * For landlords, this is a history of their rent payouts.
 */
export async function getBillingHistory(
  userId: string,
  role: 'TENANT' | 'LANDLORD'
): Promise<ApiResponse<Payment[]>> {
  if (USE_MOCKS) return mocks.mockGetBillingHistory(userId, role);
  const response = await apiClient.get<ApiResponse<Payment[]>>(
    `/payments/history?userId=${userId}&role=${role}`
  );
  return response.data;
}

/**
 * Records a real Paystack payment provisionally.
 * In a fully integrated backend, this wouldn't exist; the backend would listen for Paystack webhooks.
 * For this frontend-only phase, we explicitly tell the mock DB to record the payment as PENDING_VERIFICATION.
 */
export async function recordRealPayment(
  bookingId: string,
  amount: number,
  ref: string
): Promise<ApiResponse<{ success: boolean }>> {
  if (USE_MOCKS) return mocks.mockRecordRealPayment(bookingId, amount, ref);
  
  // If we had a real backend, we'd hit an endpoint like /payments/provisional
  const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
    `/payments/provisional`,
    { bookingId, amount, ref }
  );
  return response.data;
}
