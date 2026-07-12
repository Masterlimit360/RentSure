import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/bookings.mock';
import { supabase, mapSupabaseError } from './supabase';
import type { ApiResponse, CreateBookingRequest } from '@/types';
import type { Booking } from '@/types';

const ts = () => new Date().toISOString();

function mapToBooking(row: any): Booking {
  return {
    id: row.id,
    propertyId: row.property_id,
    tenantId: row.tenant_id,
    status: row.status,
    requestedAt: row.requested_at,
    moveInDate: row.move_in_date,
    durationMonths: row.duration_months,
    totalAmount: row.total_amount,
    bookingRef: row.booking_ref,
  };
}

export async function createBooking(
  tenantId: string,
  req: CreateBookingRequest
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockCreateBooking(tenantId, req);
  
  const { data, error } = await supabase.rpc('create_booking', {
    p_property_id: req.propertyId,
    p_move_in_date: req.moveInDate,
    p_duration_months: req.durationMonths
  });

  if (error) {
    let err = mapSupabaseError(error);
    if (error.message.includes('not available')) err.code = 'PROPERTY_UNAVAILABLE';
    if (error.message.includes('active booking')) err.code = 'DUPLICATE_BOOKING';
    return { success: false, data: null, error: err, timestamp: ts() };
  }

  return { success: true, data: mapToBooking(data), error: null, timestamp: ts() };
}

export async function listMyBookings(
  userId: string,
  userRole: 'TENANT' | 'LANDLORD'
): Promise<ApiResponse<Booking[]>> {
  if (USE_MOCKS) return mocks.mockListMyBookings(userId, userRole);
  
  // RLS ensures they only see their own bookings
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: (data || []).map(mapToBooking), error: null, timestamp: ts() };
}

export async function acceptBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockAcceptBooking(bookingId);
  
  const { data, error } = await supabase.rpc('accept_booking', {
    p_booking_id: bookingId
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToBooking(data), error: null, timestamp: ts() };
}

export async function rejectBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockRejectBooking(bookingId);
  
  const { data, error } = await supabase.rpc('reject_booking', {
    p_booking_id: bookingId
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToBooking(data), error: null, timestamp: ts() };
}

export async function confirmMoveIn(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockConfirmMoveIn(bookingId);
  
  const { data, error } = await supabase.rpc('confirm_move_in', {
    p_booking_id: bookingId
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToBooking(data), error: null, timestamp: ts() };
}

export async function payBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockPayBooking(bookingId);
  
  // Stub — actual payment happens via initializePayment in payments.api.ts
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  
  return { success: true, data: mapToBooking(data), error: null, timestamp: ts() };
}

export async function cancelBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return mocks.mockCancelBooking ? mocks.mockCancelBooking(bookingId) : { success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented in mocks' }, timestamp: ts() };
  
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToBooking(data), error: null, timestamp: ts() };
}
