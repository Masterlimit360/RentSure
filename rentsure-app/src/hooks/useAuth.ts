/**
 * Authentication hooks.
 *
 * Wraps the auth API in TanStack Query mutations and syncs success/failure
 * with the Zustand auth store.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, verifyEmail, updateProfile, verifyOtp, resetPassword } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import type { LoginRequest, RegisterRequest, VerifyEmailRequest } from '@/types';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      }
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: (res) => {
      if (res.success && res.data && (res.data as any).accessToken) {
        setAuth((res.data as any).user, (res.data as any).accessToken, (res.data as any).refreshToken);
      }
    }
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => verifyEmail(data),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (req: { email: string; token: string }) => 
      verifyEmail({ email: req.email, otp: req.token }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) => resetPassword(email),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await logout(refreshToken);
      }
    },
    onSettled: () => {
      /* Always clear local state even if the server call fails */
      clearAuth();
      /* Clear all cached domain data */
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { fullName: string; phone: string } }) => 
      updateProfile(userId, data),
    onSuccess: (res) => {
      if (res.success && res.data && accessToken && refreshToken) {
        setAuth(res.data, accessToken, refreshToken);
      }
    },
  });
}
