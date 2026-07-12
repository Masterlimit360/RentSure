/**
 * Notification hooks.
 *
 * Notifications are fetched on tab focus and marked all-read immediately.
 * The unread count that drives the tab badge is kept in a Zustand store
 * (notifications.store.ts) so the tab navigator can react to it without
 * subscribing to TanStack Query directly.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markAllRead, clearAllNotifications, deleteNotification } from '@/api/notifications.api';

export const queryKeys = {
  notifications: (userId: string) => ['notifications', userId] as const,
};

/**
 * Fetch all notifications for a user, sorted newest-first.
 */
export function useNotifications(userId: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => listNotifications(userId),
    enabled: !!userId,
  });
}

/**
 * Mark all notifications as read.
 * Call this on focus of the notifications screen, not on every render.
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => markAllRead(userId),
    onSuccess: (_, userId) => {
      // Invalidate to trigger a re-fetch so the unread indicators clear
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
    },
  });
}

/**
 * Clear all notifications for a user.
 */
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => clearAllNotifications(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
    },
  });
}

/**
 * Delete a specific notification.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) => deleteNotification(notificationId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
    },
  });
}
