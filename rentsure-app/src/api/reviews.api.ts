/**
 * Reviews API endpoints.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/reviews.mock';
import type { ApiResponse, CreateReviewRequest } from '@/types';
import type { Review } from '@/types';

export async function createReview(
  reviewerId: string, // Used in mocks only, real API extracts from JWT
  req: CreateReviewRequest
): Promise<ApiResponse<Review>> {
  if (USE_MOCKS) return mocks.mockCreateReview(reviewerId, req);
  const response = await apiClient.post<ApiResponse<Review>>('/reviews', req);
  return response.data;
}

export async function listReviewsByProperty(
  propertyId: string
): Promise<ApiResponse<Review[]>> {
  if (USE_MOCKS) return mocks.mockListReviewsByProperty(propertyId);
  const response = await apiClient.get<ApiResponse<Review[]>>(`/properties/${propertyId}/reviews`);
  return response.data;
}
