/**
 * Booking data hooks.
 *
 * Every mutation here maps 1-to-1 to a booking state machine transition.
 * After any mutation succeeds, we invalidate the full bookings cache so
 * all screens automatically reflect the new status without stale reads.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBooking,
  listMyBookings,
  acceptBooking,
  rejectBooking,
  confirmMoveIn,
  payBooking,
} from '@/api/bookings.api';
import type { CreateBookingRequest } from '@/types';

export const queryKeys = {
  bookings: ['bookings'] as const,
  myBookings: (userId: string, role: string) => ['bookings', 'mine', userId, role] as const,
};

/**
 * Fetches bookings for a given user, varying by their role.
 * Tenants see their own bookings; landlords see bookings on properties they own.
 * Preconditions: userId and role must be defined.
 */
export function useMyBookings(userId: string, role: 'TENANT' | 'LANDLORD') {
  return useQuery({
    queryKey: queryKeys.myBookings(userId, role),
    queryFn: () => listMyBookings(userId, role),
    enabled: !!userId,
  });
}

/**
 * Creates a new booking request (REQUESTED state).
 * Preconditions: Tenant is authenticated. Property must be AVAILABLE.
 * @throws PROPERTY_UNAVAILABLE / DUPLICATE_BOOKING from mock/backend.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, req }: { tenantId: string; req: CreateBookingRequest }) =>
      createBooking(tenantId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

/**
 * Landlord accepts a pending booking (REQUESTED → ACCEPTED).
 * Preconditions: Landlord owns the property. Booking is in REQUESTED state.
 * @throws INVALID_STATE if the booking is not REQUESTED.
 */
export function useAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => acceptBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

/**
 * Landlord rejects a pending booking (REQUESTED → REJECTED).
 * Preconditions: Landlord owns the property. Booking is in REQUESTED state.
 * @throws INVALID_STATE if the booking is not REQUESTED.
 */
export function useRejectBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => rejectBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

/**
 * Tenant confirms move-in, releasing escrow to the landlord (PAID_ESCROW → MOVED_IN).
 *
 * IMPORTANT: This is irreversible. Once the tenant confirms, the payment's
 * escrowStatus changes from HELD to RELEASED and landlord receives funds.
 * The UI surfaces a confirmation dialog before calling this.
 *
 * Preconditions: Tenant is authenticated. Booking is in PAID_ESCROW state.
 * @throws INVALID_STATE if the booking is not PAID_ESCROW.
 */
export function useConfirmMoveIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => confirmMoveIn(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

/**
 * Tenant pays for an accepted booking (ACCEPTED → PAID_ESCROW).
 * This is a stubbed flow — no real Paystack call is made in mocks.
 * A real integration would redirect to a Paystack checkout URL and handle the webhook.
 * Preconditions: Tenant is authenticated. Booking is in ACCEPTED state.
 * @throws INVALID_STATE if the booking is not ACCEPTED.
 */
export function usePayBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => payBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}
