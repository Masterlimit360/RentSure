import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, ErrorInfo, Component } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Toast } from '@/components/ui/Toast';
import { initDb } from '@/mocks/store';

// MOCK: Sentry Initialization
const setupSentry = () => {
  const originalError = console.error;
  console.error = (...args) => {
    // Sentry.captureException(args[0]);
    originalError(...args);
  };
};
setupSentry();

class GlobalErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('GlobalErrorBoundary caught:', error);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

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
      if (user?.role === 'TENANT') router.replace('/(tenant)/(tabs)');
      else if (user?.role === 'LANDLORD') router.replace('/(landlord)/(tabs)');
      else if (user?.role === 'ADMIN') router.replace('/(admin)/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, user, router]);

  if (isLoading) {
    // A real splash screen would go here
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Slot />
        <Toast />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
