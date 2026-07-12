import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/payments.mock';
import { supabase, mapSupabaseError } from './supabase';
import type {
  ApiResponse,
  InitializePaymentResponse,
  PaymentStatusResponse,
} from '@/types';
import type { Payment } from '@/types';

const ts = () => new Date().toISOString();

export async function initializePayment(
  bookingId: string
): Promise<ApiResponse<InitializePaymentResponse>> {
  if (USE_MOCKS) return mocks.mockInitializePayment(bookingId);
  
  const { data, error } = await supabase.functions.invoke('paystack-init', {
    body: { bookingId }
  });

  if (error || data?.error) {
    return { success: false, data: null, error: error ? mapSupabaseError(error) : { code: 'PAYMENT_INIT_ERROR', message: data?.error }, timestamp: ts() };
  }

  return {
    success: true,
    data: {
      checkoutUrl: data.checkoutUrl,
      paystackRef: data.paystackRef,
    },
    error: null,
    timestamp: ts(),
  };
}

export async function getPaymentStatus(
  bookingId: string
): Promise<ApiResponse<PaymentStatusResponse>> {
  if (USE_MOCKS) return mocks.mockGetPaymentStatus(bookingId);
  
  // Fetch booking and payment in parallel since they're independent reads
  const [bookingRes, paymentRes] = await Promise.all([
    supabase.from('bookings').select('status').eq('id', bookingId).single(),
    supabase.from('payments').select('*').eq('booking_id', bookingId).single(),
  ]);

  if (bookingRes.error || !bookingRes.data) {
    return { success: false, data: null, error: bookingRes.error ? mapSupabaseError(bookingRes.error) : { code: 'NOT_FOUND', message: 'Booking not found' }, timestamp: ts() };
  }

  const payment = paymentRes.data;

  // Map to the PaymentStatusResponse contract shape
  const escrowStatus: import('@/types').EscrowStatus =
    bookingRes.data.status === 'PAID_ESCROW' || payment?.escrow_status === 'HELD'
      ? 'HELD'
      : payment?.escrow_status === 'PENDING'
        ? 'PENDING_VERIFICATION'
        : 'PENDING_VERIFICATION'; // Default when no payment exists yet

  return {
    success: true,
    data: {
      bookingId,
      amount: payment?.amount ?? 0,
      escrowStatus,
      paidAt: payment?.paid_at ?? '',
      releasedAt: payment?.released_at,
    },
    error: null,
    timestamp: ts(),
  };
}

export async function getBillingHistory(
  userId: string,
  role: 'TENANT' | 'LANDLORD'
): Promise<ApiResponse<Payment[]>> {
  if (USE_MOCKS) return mocks.mockGetBillingHistory(userId, role);
  
  const { data, error } = await supabase
    .from('payments')
    .select('*, bookings(tenant_id, properties(landlord_id))');

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  // Filter in memory since querying nested foreign tables with OR is complex via JS API
  const filtered: Payment[] = (data || [])
    .filter((p: any) => {
      if (role === 'TENANT') return p.bookings?.tenant_id === userId;
      return p.bookings?.properties?.landlord_id === userId;
    })
    .map((p: any) => ({
      id: p.id,
      bookingId: p.booking_id,
      paystackRef: p.paystack_ref,
      amount: p.amount,
      fee: p.fee,
      escrowStatus: p.escrow_status,
      paidAt: p.paid_at,
      releasedAt: p.released_at,
    }));

  return { success: true, data: filtered, error: null, timestamp: ts() };
}

export async function recordRealPayment(
  bookingId: string,
  amount: number,
  ref: string
): Promise<ApiResponse<{ success: boolean }>> {
  if (USE_MOCKS) return mocks.mockRecordRealPayment(bookingId, amount, ref);
  
  // Real backend uses webhooks exclusively. This is a no-op in Supabase-direct mode.
  return { success: true, data: { success: true }, error: null, timestamp: ts() };
}
