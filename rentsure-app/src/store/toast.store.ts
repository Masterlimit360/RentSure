/**
 * Global toast notification state (Zustand).
 *
 * Provides a simple API to show success/error banners across the app.
 * Only one toast can be visible at a time.
 */

import { create } from 'zustand';

type ToastType = 'success' | 'error';

interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  isVisible: false,
  message: '',
  type: 'success',

  showToast: (message, type = 'success') => {
    set({ isVisible: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      set({ isVisible: false });
    }, 3000);
  },

  hideToast: () => set({ isVisible: false }),
}));
