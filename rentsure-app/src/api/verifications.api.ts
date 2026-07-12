import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/verifications.mock';
import { supabase, mapSupabaseError } from './supabase';
import type { ApiResponse, SubmitVerificationRequest, PaginatedResponse } from '@/types';
import type { Verification } from '@/types';

const ts = () => new Date().toISOString();

/**
 * Maps a Supabase row to the Verification contract.
 * DB uses generic columns (user_id, entity_type, entity_id, document_url),
 * but the frontend Verification interface uses landlordId, docType, docUrl, etc.
 */
function mapToVerification(data: any): Verification {
  return {
    id: data.id,
    landlordId: data.landlord_id,
    propertyId: data.property_id,
    docType: data.doc_type,
    docUrl: data.doc_url,
    status: data.status,
    submittedAt: data.created_at,
    reviewedAt: data.updated_at !== data.created_at ? data.updated_at : undefined,
    rejectionReason: data.rejection_reason,
  };
}

export async function submitVerification(
  landlordId: string,
  req: SubmitVerificationRequest
): Promise<ApiResponse<Verification>> {
  if (USE_MOCKS) return mocks.mockSubmitVerification(landlordId, req);
  
  const { data, error } = await supabase.from('verifications').insert({
    landlord_id: landlordId,
    property_id: req.propertyId || null,
    doc_type: req.docType,
    doc_url: req.docUrl,
    status: 'PENDING'
  }).select().single();

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToVerification(data), error: null, timestamp: ts() };
}

export async function adminApproveVerification(
  verificationId: string
): Promise<ApiResponse<Verification>> {
  if (USE_MOCKS) return mocks.mockAdminApproveVerification(verificationId);
  
  const { data: result, error } = await supabase.rpc('admin_verify', {
    p_verification_id: verificationId,
    p_approve: true,
    p_notes: null
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  // Re-fetch the verification to return fresh data
  const { data: updated } = await supabase.from('verifications').select('*').eq('id', verificationId).single();
  return { success: true, data: mapToVerification(updated || { id: verificationId, status: 'APPROVED' }), error: null, timestamp: ts() };
}

export async function adminRejectVerification(
  verificationId: string
): Promise<ApiResponse<Verification>> {
  if (USE_MOCKS) return mocks.mockAdminRejectVerification(verificationId);
  
  const { data: result, error } = await supabase.rpc('admin_verify', {
    p_verification_id: verificationId,
    p_approve: false,
    p_notes: null
  });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  const { data: updated } = await supabase.from('verifications').select('*').eq('id', verificationId).single();
  return { success: true, data: mapToVerification(updated || { id: verificationId, status: 'REJECTED' }), error: null, timestamp: ts() };
}

export async function listVerifications(): Promise<ApiResponse<PaginatedResponse<Verification>>> {
  if (USE_MOCKS) return mocks.mockListVerifications();
  
  const { data, count, error } = await supabase
    .from('verifications')
    .select('*', { count: 'exact' });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return {
    success: true,
    data: {
      content: (data || []).map(mapToVerification),
      totalElements: count || 0,
      totalPages: 1,
      page: 0,
      size: count || 0,
    },
    error: null,
    timestamp: ts(),
  };
}
