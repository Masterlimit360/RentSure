/**
 * Reviews hooks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview, listReviewsByProperty } from '@/api/reviews.api';
import type { CreateReviewRequest } from '@/types';

export const queryKeys = {
  reviews: (propertyId: string) => ['reviews', propertyId] as const,
};

export function usePropertyReviews(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.reviews(propertyId),
    queryFn: () => listReviewsByProperty(propertyId),
    enabled: !!propertyId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewerId, req }: { reviewerId: string; req: CreateReviewRequest }) =>
      createReview(reviewerId, req),
    onSuccess: (_, variables) => {
      // Invalidate both reviews and bookings because a submitted review transitions booking to COMPLETED
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
