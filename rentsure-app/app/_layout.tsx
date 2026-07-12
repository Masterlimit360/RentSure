import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Toast } from '@/components/ui/Toast';
import { initDb } from '@/mocks/store';

// Initialize the TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { loadStoredAuth, isLoading, isAuthenticated, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load auth state and initialize mock DB on startup
  useEffect(() => {
    async function initializeApp() {
      await initDb();
      await loadStoredAuth();
    }
    initializeApp();
  }, [loadStoredAuth]);

  // Route guarding based on auth state and role
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from auth pages if already logged in
      if (user?.role === 'TENANT') router.replace('/(tenant)');
      else if (user?.role === 'LANDLORD') router.replace('/(landlord)');
      else if (user?.role === 'ADMIN') router.replace('/(admin)');
    }
  }, [isAuthenticated, isLoading, segments, user, router]);

  if (isLoading) {
    // A real splash screen would go here
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
      <Toast />
    </QueryClientProvider>
  );
}
