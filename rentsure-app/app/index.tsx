import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import React from 'react';

export default function Index() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'TENANT') {
    return <Redirect href="/(tenant)" />;
  }

  if (user?.role === 'LANDLORD') {
    return <Redirect href="/(landlord)" />;
  }

  if (user?.role === 'ADMIN') {
    return <Redirect href="/(admin)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
