/**
 * Agreement hooks.
 *
 * Both tenant and landlord must sign the digital rental agreement before
 * move-in can be confirmed. The agreement is auto-created server-side when
 * a booking reaches PAID_ESCROW — the UI only needs to fetch and sign it.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgreement, signAgreement } from '@/api/agreements.api';
import type { SignAgreementRequest } from '@/types';

export const queryKeys = {
  agreement: (bookingId: string) => ['agreements', bookingId] as const,
};

/**
 * Fetch the agreement for a booking.
 * Only enabled for bookings in PAID_ESCROW or later.
 */
export function useAgreement(bookingId: string) {
  return useQuery({
    queryKey: queryKeys.agreement(bookingId),
    queryFn: () => getAgreement(bookingId),
    enabled: !!bookingId,
  });
}

/**
 * Sign the rental agreement.
 * Preconditions: Caller is an authenticated party to this booking.
 *   - Each role (TENANT/LANDLORD) may only sign once.
 * @throws ALREADY_SIGNED if this party has already signed.
 */
export function useSignAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, req }: { bookingId: string; req: SignAgreementRequest }) =>
      signAgreement(bookingId, req),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agreement(bookingId) });
    },
  });
}
