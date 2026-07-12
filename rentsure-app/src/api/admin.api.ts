/**
 * Admin API endpoints.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/admin.mock';
import type { ApiResponse, PaginatedResponse, AdminUserFilters } from '@/types';
import type { User } from '@/types';

export async function listUsers(
  filters: AdminUserFilters
): Promise<ApiResponse<PaginatedResponse<User>>> {
  if (USE_MOCKS) return mocks.mockListUsers(filters);
  const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/admin/users', {
    params: filters,
  });
  return response.data;
}

export async function suspendUser(
  userId: string
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockSuspendUser(userId);
  const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/suspend`);
  return response.data;
}

export async function reactivateUser(
  userId: string
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockReactivateUser(userId);
  const response = await apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}/reactivate`);
  return response.data;
}
