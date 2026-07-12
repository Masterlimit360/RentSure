/**
 * Verifications API endpoints.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/verifications.mock';
import type { ApiResponse, SubmitVerificationRequest } from '@/types';
import type { Verification } from '@/types';

export async function submitVerification(
  landlordId: string, // Used in mocks only, real API extracts from JWT
  req: SubmitVerificationRequest
): Promise<ApiResponse<Verification>> {
  if (USE_MOCKS) return mocks.mockSubmitVerification(landlordId, req);
  // Real implementation would send FormData
  const response = await apiClient.post<ApiResponse<Verification>>('/verifications', req);
  return response.data;
}

export async function adminApproveVerification(
  verificationId: string
): Promise<ApiResponse<Verification>> {
  if (USE_MOCKS) return mocks.mockAdminApproveVerification(verificationId);
  const response = await apiClient.patch<ApiResponse<Verification>>(`/admin/verifications/${verificationId}`, { status: 'APPROVED' });
  return response.data;
}

export async function adminRejectVerification(
  verificationId: string
): Promise<ApiResponse<Verification>> {
  if (USE_MOCKS) return mocks.mockAdminRejectVerification(verificationId);
  const response = await apiClient.patch<ApiResponse<Verification>>(`/admin/verifications/${verificationId}`, { status: 'REJECTED' });
  return response.data;
}

export async function listVerifications(): Promise<ApiResponse<import('@/types').PaginatedResponse<Verification>>> {
  if (USE_MOCKS) return mocks.mockListVerifications();
  const response = await apiClient.get<ApiResponse<import('@/types').PaginatedResponse<Verification>>>('/admin/verifications');
  return response.data;
}
