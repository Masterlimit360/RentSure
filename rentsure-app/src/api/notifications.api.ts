/**
 * Notifications API endpoints.
 *
 * Notifications are created server-side on booking state changes. The client
 * can only read them and mark them as read. The unread count drives the tab
 * badge in the bottom navigator via the notifications Zustand store.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/notifications.mock';
import type { ApiResponse } from '@/types';
import type { Notification } from '@/types';

/**
 * Fetch all notifications for a user, sorted newest-first.
 * Preconditions: userId must match the authenticated user.
 */
export async function listNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
  if (USE_MOCKS) return mocks.mockListNotifications(userId);
  const response = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
  return response.data;
}

/**
 * Mark all of a user's notifications as read.
 * Called automatically when the notifications tab is opened.
 */
export async function markAllRead(userId: string): Promise<ApiResponse<{ updated: number }>> {
  if (USE_MOCKS) return mocks.mockMarkAllRead(userId);
  const response = await apiClient.patch<ApiResponse<{ updated: number }>>(
    '/notifications/read-all'
  );
  return response.data;
}

/**
 * Clear all notifications for a user.
 */
export async function clearAllNotifications(userId: string): Promise<ApiResponse<{ cleared: number }>> {
  if (USE_MOCKS) return mocks.mockClearAllNotifications(userId);
  const response = await apiClient.delete<ApiResponse<{ cleared: number }>>('/notifications/clear-all');
  return response.data;
}

/**
 * Delete a specific notification.
 */
export async function deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
  if (USE_MOCKS) return mocks.mockDeleteNotification(notificationId);
  const response = await apiClient.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
  return response.data;
}
