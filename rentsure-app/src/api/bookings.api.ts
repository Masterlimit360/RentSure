/**
 * Bookings API endpoints.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/bookings.mock';
import type { ApiResponse, CreateBookingRequest } from '@/types';
import type { Booking } from '@/types';

/**
 * Creates a new booking request.
 * Preconditions: Property must be AVAILABLE. Tenant must not have an active booking for this property.
 * @throws 404 (PROPERTY_NOT_FOUND) if property does not exist.
 * @throws 409 (PROPERTY_UNAVAILABLE) if property is not AVAILABLE.
 * @throws 409 (DUPLICATE_BOOKING) if tenant already has an active booking here.
 */
export async function createBooking(
  tenantId: string,
  req: CreateBookingRequest
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockCreateBooking(tenantId, req);
  const response = await apiClient.post<ApiResponse<Booking>>('/bookings', req);
  return response.data;
}

/**
 * Lists all bookings for a user.
 * Preconditions: User must be authenticated.
 * Returns tenant's own bookings if TENANT, or bookings on landlord's properties if LANDLORD.
 */
export async function listMyBookings(
  userId: string,
  userRole: 'TENANT' | 'LANDLORD'
): Promise<ApiResponse<Booking[]>> {
  if (USE_MOCKS) return mocks.mockListMyBookings(userId, userRole);
  const response = await apiClient.get<ApiResponse<Booking[]>>('/bookings/mine');
  return response.data;
}

/**
 * Landlord accepts a pending booking request.
 * Preconditions: Booking must be in REQUESTED state. Landlord must own the property.
 * @throws 404 (BOOKING_NOT_FOUND) if booking does not exist.
 * @throws 409 (INVALID_STATE) if booking is not REQUESTED.
 */
export async function acceptBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockAcceptBooking(bookingId);
  const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${bookingId}/accept`);
  return response.data;
}

/**
 * Landlord rejects a pending booking request.
 * Preconditions: Booking must be in REQUESTED state. Landlord must own the property.
 * @throws 404 (BOOKING_NOT_FOUND) if booking does not exist.
 * @throws 409 (INVALID_STATE) if booking is not REQUESTED.
 */
export async function rejectBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockRejectBooking(bookingId);
  const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${bookingId}/reject`);
  return response.data;
}

/**
 * Tenant confirms move-in, triggering escrow release to landlord.
 * Preconditions: Booking must be in PAID_ESCROW state.
 * @throws 404 (BOOKING_NOT_FOUND) if booking does not exist.
 * @throws 409 (INVALID_STATE) if booking is not PAID_ESCROW.
 */
export async function confirmMoveIn(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockConfirmMoveIn(bookingId);
  const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${bookingId}/confirm-move-in`);
  return response.data;
}
/**
 * Tenant pays for an accepted booking (stub).
 * Preconditions: Booking must be in ACCEPTED state.
 * @throws 404 (BOOKING_NOT_FOUND) if booking does not exist.
 * @throws 409 (INVALID_STATE) if booking is not ACCEPTED.
 */
export async function payBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockPayBooking(bookingId);
  const response = await apiClient.patch<ApiResponse<Booking>>(`/bookings/${bookingId}/pay`);
  return response.data;
}
