import React from 'react';
import { NotificationsScreen } from '@/components/NotificationsScreen';
import { useAuthStore } from '@/store/auth.store';
import { Redirect } from 'expo-router';

export default function TenantNotificationsRoute() {
  const { user } = useAuthStore();
  
  if (!user) return <Redirect href="/(auth)/login" />;
  
  return <NotificationsScreen userId={user.id} />;
}
