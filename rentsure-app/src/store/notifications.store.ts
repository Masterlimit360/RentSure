/**
 * Notifications unread count store (Zustand).
 *
 * Tracks the number of unread notifications so the tab navigator can
 * show a badge dot without subscribing to TanStack Query directly.
 * Updated after fetching notifications and cleared when the inbox is opened.
 *
 * IMPORTANT: This is UI state only — it is NOT persisted to SecureStore.
 * On app restart the count is re-derived from the notifications query.
 */

import { create } from 'zustand';

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  clearUnread: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  clearUnread: () => set({ unreadCount: 0 }),
}));
