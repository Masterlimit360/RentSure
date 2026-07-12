/**
 * Properties API endpoints.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/properties.mock';
import type {
  ApiResponse,
  PaginatedResponse,
  PropertyFilters,
  CreatePropertyRequest,
  UpdatePropertyRequest,
} from '@/types';
import type { Property, PropertyMedia } from '@/types';

export async function listProperties(
  filters: PropertyFilters
): Promise<ApiResponse<PaginatedResponse<Property>>> {
  if (USE_MOCKS) return mocks.mockListProperties(filters);
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Property>>>('/properties', {
    params: filters,
  });
  return response.data;
}

export async function getPropertyById(
  id: string
): Promise<ApiResponse<Property>> {
  if (USE_MOCKS) return mocks.mockGetPropertyById(id);
  const response = await apiClient.get<ApiResponse<Property>>(`/properties/${id}`);
  return response.data;
}

export async function createProperty(
  landlordId: string,
  req: CreatePropertyRequest
): Promise<ApiResponse<Property>> {
  if (USE_MOCKS) return mocks.mockCreateProperty(landlordId, req);
  const response = await apiClient.post<ApiResponse<Property>>('/properties', req);
  return response.data;
}

export async function updateProperty(
  landlordId: string,
  propertyId: string,
  req: UpdatePropertyRequest
): Promise<ApiResponse<Property>> {
  if (USE_MOCKS) return mocks.mockUpdateProperty(landlordId, propertyId, req);
  const response = await apiClient.put<ApiResponse<Property>>(`/properties/${propertyId}`, req);
  return response.data;
}

export async function softDeleteProperty(
  landlordId: string,
  propertyId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  if (USE_MOCKS) return mocks.mockSoftDeleteProperty(landlordId, propertyId);
  const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/properties/${propertyId}/hide`);
  return response.data;
}

export async function hardDeleteProperty(
  landlordId: string,
  propertyId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  if (USE_MOCKS) return mocks.mockHardDeleteProperty(landlordId, propertyId);
  const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/properties/${propertyId}`);
  return response.data;
}

export async function uploadMedia(
  propertyId: string,
  mediaType: 'PHOTO' | 'VIDEO'
): Promise<ApiResponse<PropertyMedia>> {
  if (USE_MOCKS) return mocks.mockUploadMedia(propertyId, mediaType);
  // Real implementation would send FormData
  const response = await apiClient.post<ApiResponse<PropertyMedia>>(`/properties/${propertyId}/media`);
  return response.data;
}
