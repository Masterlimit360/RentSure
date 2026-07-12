/**
 * Global authentication state (Zustand).
 *
 * Stores the current user profile and tokens. Integrates with expo-secure-store
 * for persistent sessions across app restarts.
 *
 * IMPORTANT: This store is ONLY for authentication state. Do not use it to
 * store properties, bookings, or other domain data. Domain data belongs in
 * TanStack Query's cache.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { setTokens, clearTokens } from '@/api/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

const SECURE_STORE_USER_KEY = 'rentsure_user';
const SECURE_STORE_ACCESS_KEY = 'rentsure_access';
const SECURE_STORE_REFRESH_KEY = 'rentsure_refresh';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true, // Start loading until we check SecureStore
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    /* Update API client interceptors */
    setTokens(accessToken, refreshToken);

    /* Persist to SecureStore */
    try {
      await SecureStore.setItemAsync(SECURE_STORE_USER_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(SECURE_STORE_ACCESS_KEY, accessToken);
      await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, refreshToken);
    } catch (e) {
      console.error('Failed to save auth state to SecureStore', e);
    }

    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    /* Clear API client interceptors */
    clearTokens();

    /* Clear SecureStore */
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_USER_KEY);
      await SecureStore.deleteItemAsync(SECURE_STORE_ACCESS_KEY);
      await SecureStore.deleteItemAsync(SECURE_STORE_REFRESH_KEY);
    } catch (e) {
      console.error('Failed to clear auth state from SecureStore', e);
    }

    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  loadStoredAuth: async () => {
    try {
      const storedUser = await SecureStore.getItemAsync(SECURE_STORE_USER_KEY);
      const accessToken = await SecureStore.getItemAsync(SECURE_STORE_ACCESS_KEY);
      const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_REFRESH_KEY);

      if (storedUser && accessToken && refreshToken) {
        const user = JSON.parse(storedUser);
        setTokens(accessToken, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      }
    } catch (e) {
      console.error('Failed to load auth state from SecureStore', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
