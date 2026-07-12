/**
 * Admin hooks.
 * 
 * Manages admin data fetching and mutations (users, verifications).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, suspendUser, reactivateUser, listAllBookings, releaseEscrow } from '@/api/admin.api';
import { listVerifications, adminApproveVerification, adminRejectVerification } from '@/api/verifications.api';
import type { AdminUserFilters } from '@/types';

export const adminQueryKeys = {
  users: (filters: AdminUserFilters) => ['admin', 'users', filters] as const,
  verifications: ['admin', 'verifications'] as const,
  bookings: ['admin', 'bookings'] as const,
};

export function useAdminUsers(filters: AdminUserFilters) {
  return useQuery({
    queryKey: adminQueryKeys.users(filters),
    queryFn: () => listUsers(filters),
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => suspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminVerifications() {
  return useQuery({
    queryKey: adminQueryKeys.verifications,
    queryFn: () => listVerifications(),
  });
}

export function useApproveVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (verificationId: string) => adminApproveVerification(verificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.verifications });
    },
  });
}

export function useRejectVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (verificationId: string) => adminRejectVerification(verificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.verifications });
    },
  });
}

export function useAdminBookings() {
  return useQuery({
    queryKey: adminQueryKeys.bookings,
    queryFn: () => listAllBookings(),
  });
}

export function useReleaseEscrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => releaseEscrow(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.bookings });
    },
  });
}
