import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/admin.mock';
import { supabase, mapSupabaseError } from './supabase';
import type { ApiResponse, PaginatedResponse, AdminUserFilters } from '@/types';
import type { User, Booking } from '@/types';

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

function mapToUser(row: any): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: '', // Profiles table doesn't store email; it's in auth.users
    phone: row.phone || '',
    role: row.role,
    isVerifiedEmail: true, // Assumed if they have a profile
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listUsers(
  filters: AdminUserFilters
): Promise<ApiResponse<PaginatedResponse<User>>> {
  if (USE_MOCKS) return mocks.mockListUsers(filters);
  
  let query = supabase.from('profiles').select('*', { count: 'exact' });
  if (filters.role) query = query.eq('role', filters.role);
  if (filters.status) query = query.eq('status', filters.status);

  const page = filters.page || 0;
  const size = filters.size || 20;
  query = query.range(page * size, page * size + size - 1);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return {
    success: true,
    data: {
      content: (data || []).map(mapToUser),
      totalElements: count || 0,
      totalPages: Math.ceil((count || 0) / size),
      page,
      size,
    },
    error: null,
    timestamp: ts(),
  };
}

export async function suspendUser(
  userId: string
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockSuspendUser(userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'SUSPENDED' })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToUser(data), error: null, timestamp: ts() };
}

export async function reactivateUser(
  userId: string
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockReactivateUser(userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'ACTIVE' })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToUser(data), error: null, timestamp: ts() };
}

export async function listAllBookings(): Promise<ApiResponse<Booking[]>> {
  if (USE_MOCKS) return { success: true, data: [], error: null, timestamp: ts() };
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: (data || []).map(mapToBooking), error: null, timestamp: ts() };
}

export async function releaseEscrow(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  if (USE_MOCKS) return { success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented in mocks' }, timestamp: ts() };
  
  const { data, error } = await supabase.rpc('release_escrow', {
    p_booking_id: bookingId
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToBooking(data), error: null, timestamp: ts() };
}
