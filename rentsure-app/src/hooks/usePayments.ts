/**
 * Payment hooks.
 *
 * useInitializePayment kicks off the Paystack checkout. In production the
 * tenant then opens a WebBrowser session; the server-side webhook transitions
 * the booking to PAID_ESCROW. In mocks the transition happens immediately.
 *
 * usePaymentStatus accepts a configurable refetchInterval for polling after
 * the checkout browser closes — set it to false once PAID_ESCROW is confirmed
 * to avoid burning unnecessary network calls.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initializePayment, getPaymentStatus, getBillingHistory } from '@/api/payments.api';

export const queryKeys = {
  paymentStatus: (bookingId: string) => ['payments', 'status', bookingId] as const,
  billingHistory: (userId: string, role: string) => ['payments', 'history', userId, role] as const,
};

/**
 * Initializes a Paystack payment for an ACCEPTED booking.
 * Returns a checkoutUrl to open via WebBrowser.openBrowserAsync.
 * Preconditions: Booking must be in ACCEPTED state.
 * @throws INVALID_STATE if booking is not ACCEPTED.
 */
export function useInitializePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => initializePayment(bookingId),
    onSuccess: (_, bookingId) => {
      // Booking transitions to PAID_ESCROW after payment; invalidate so
      // the bookings list reflects the new status without a manual refresh.
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStatus(bookingId) });
    },
  });
}

/**
 * Polls payment status for a booking after checkout.
 * Pass refetchInterval: 3000 while polling, false when PAID_ESCROW is confirmed.
 */
export function usePaymentStatus(
  bookingId: string,
  refetchInterval: number | false = false
) {
  return useQuery({
    queryKey: queryKeys.paymentStatus(bookingId),
    queryFn: () => getPaymentStatus(bookingId),
    enabled: !!bookingId,
    refetchInterval,
  });
}

export function useBillingHistory(userId?: string, role?: 'TENANT' | 'LANDLORD') {
  return useQuery({
    queryKey: queryKeys.billingHistory(userId || '', role || ''),
    queryFn: () => {
      if (!userId || !role) throw new Error('Missing params');
      return getBillingHistory(userId, role);
    },
    enabled: !!userId && !!role,
  });
}
