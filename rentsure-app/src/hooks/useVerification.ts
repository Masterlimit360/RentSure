/**
 * Verification hooks.
 * 
 * Manages landlord verification submission and status updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitVerification } from '@/api/verifications.api';
import { useAuthStore } from '@/store/auth.store';
import type { SubmitVerificationRequest } from '@/types';

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: (req: SubmitVerificationRequest) => {
      if (!user) throw new Error('Not authenticated');
      return submitVerification(user.id, req);
    },
    onSuccess: (res) => {
      if (res.success && user && accessToken && refreshToken) {
        // Set to PENDING so the Admin app can approve it
        setAuth({ ...user, verificationStatus: 'PENDING' }, accessToken, refreshToken);
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
  });
}
