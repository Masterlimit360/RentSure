import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/agreements.mock';
import { supabase, mapSupabaseError } from './supabase';
import type { ApiResponse, SignAgreementRequest } from '@/types';
import type { Agreement } from '@/types';

const ts = () => new Date().toISOString();

function mapToAgreement(data: any): Agreement {
  return {
    id: data.id,
    bookingId: data.booking_id,
    pdfUrl: data.pdf_url,
    tenantSignedAt: data.tenant_signed_at,
    landlordSignedAt: data.landlord_signed_at,
  };
}

export async function getAgreement(bookingId: string): Promise<ApiResponse<Agreement>> {
  if (USE_MOCKS) return mocks.mockGetAgreement(bookingId);
  
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error || !data) {
    return { success: false, data: null, error: error ? mapSupabaseError(error) : { code: 'AGREEMENT_NOT_FOUND', message: 'Agreement not found' }, timestamp: ts() };
  }

  return { success: true, data: mapToAgreement(data), error: null, timestamp: ts() };
}

export async function signAgreement(
  bookingId: string,
  req: SignAgreementRequest
): Promise<ApiResponse<Agreement>> {
  if (USE_MOCKS) return mocks.mockSignAgreement(bookingId, req);
  const { data, error } = await supabase
    .rpc('sign_agreement', {
      p_booking_id: bookingId,
      p_role: req.role,
    });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToAgreement(data), error: null, timestamp: ts() };
}
