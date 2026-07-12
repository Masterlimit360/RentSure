import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/reviews.mock';
import { supabase, mapSupabaseError } from './supabase';
import type { ApiResponse, CreateReviewRequest } from '@/types';
import type { Review } from '@/types';

const ts = () => new Date().toISOString();

export async function createReview(
  reviewerId: string,
  req: CreateReviewRequest
): Promise<ApiResponse<Review>> {
  if (USE_MOCKS) return mocks.mockCreateReview(reviewerId, req);
  
  const { data, error } = await supabase.from('reviews').insert({
    booking_id: req.bookingId,
    reviewer_id: reviewerId,
    reviewee_id: req.revieweeId,
    rating: req.rating,
    comment: req.comment,
  }).select().single();

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return {
    success: true,
    data: {
      id: data.id,
      bookingId: data.booking_id,
      reviewerId: data.reviewer_id,
      revieweeId: data.reviewee_id,
      rating: data.rating,
      comment: data.comment,
      createdAt: data.created_at,
    },
    error: null,
    timestamp: ts(),
  };
}

export async function listReviewsByProperty(
  propertyId: string
): Promise<ApiResponse<Review[]>> {
  if (USE_MOCKS) return mocks.mockListReviewsByProperty(propertyId);
  
  // Need to get all reviews where the booking belongs to this property
  const { data, error } = await supabase
    .from('reviews')
    .select('*, bookings!inner(property_id)')
    .eq('bookings.property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return {
    success: true,
    data: (data || []).map((r: any) => ({
      id: r.id,
      bookingId: r.booking_id,
      reviewerId: r.reviewer_id,
      revieweeId: r.reviewee_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    })),
    error: null,
    timestamp: ts(),
  };
}
