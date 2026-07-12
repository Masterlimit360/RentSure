/**
 * Verification hooks.
 * 
 * Manages landlord verification submission and status updates.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submitVerification, listLandlordVerifications } from '@/api/verifications.api';
import { useAuthStore } from '@/store/auth.store';
import type { SubmitVerificationRequest } from '@/types';

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (req: SubmitVerificationRequest) => {
      if (!user) throw new Error('Not authenticated');
      return submitVerification(user.id, req);
    },
    onSuccess: (res) => {
      if (res.success && user) {
        queryClient.invalidateQueries({ queryKey: ['verifications', user.id] });
      }
    },
  });
}

export function useLandlordVerifications(landlordId: string) {
  return useQuery({
    queryKey: ['verifications', landlordId],
    queryFn: () => listLandlordVerifications(landlordId),
    enabled: !!landlordId,
  });
}
