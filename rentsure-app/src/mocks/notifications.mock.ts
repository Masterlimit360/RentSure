/**
 * Mock notifications endpoints.
 *
 * In production, notifications are created by backend event listeners on
 * booking state changes. Here we serve from the in-memory seed in store.ts
 * and mutate isRead directly on markAllRead.
 */

import { db, flushDb } from './store';
import { simulateLatency, wrapResponse } from '@/utils/format';
import type { ApiResponse } from '@/types';
import type { Notification } from '@/types';

/**
 * List all notifications for a user, sorted newest-first.
 */
export async function mockListNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
  await simulateLatency();

  const notifications = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return wrapResponse(notifications);
}

/**
 * Mark all of a user's notifications as read.
 * Returns the count of notifications that were updated.
 */
export async function mockMarkAllRead(userId: string): Promise<ApiResponse<{ updated: number }>> {
  await simulateLatency();

  let updated = 0;
  db.notifications.forEach((n) => {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      updated++;
    }
  });

  if (updated > 0) {
    await flushDb();
  }

  return wrapResponse({ updated });
}

/**
 * Clear all notifications for a user.
 */
export async function mockClearAllNotifications(userId: string): Promise<ApiResponse<{ cleared: number }>> {
  await simulateLatency();

  const originalLength = db.notifications.length;
  db.notifications = db.notifications.filter(n => n.userId !== userId);
  const cleared = originalLength - db.notifications.length;

  if (cleared > 0) {
    await flushDb();
  }

  return wrapResponse({ cleared });
}

/**
 * Delete a specific notification.
 */
export async function mockDeleteNotification(notificationId: string): Promise<ApiResponse<void>> {
  await simulateLatency();

  const originalLength = db.notifications.length;
  db.notifications = db.notifications.filter(n => n.id !== notificationId);
  const cleared = originalLength - db.notifications.length;

  if (cleared > 0) {
    await flushDb();
  }

  return wrapResponse(undefined);
}
