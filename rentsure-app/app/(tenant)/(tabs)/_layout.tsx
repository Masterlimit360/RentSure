/**
 * Tenant Bottom Tab Navigator.
 *
 * Provides the main shell for all tenant-specific screens.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useNotificationsStore } from '@/store/notifications.store';
import { useAuthStore } from '@/store/auth.store';
import { useNotifications } from '@/hooks/useNotifications';

function InboxButton() {
  const { unreadCount } = useNotificationsStore();
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push('/(tenant)/notifications')} style={styles.headerBtn}>
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <View style={styles.badgeInner} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TenantLayout() {
  const { user } = useAuthStore();
  const { data } = useNotifications(user?.id ?? '');
  const { setUnreadCount, unreadCount } = useNotificationsStore();
  
  React.useEffect(() => {
    if (data?.data) {
      setUnreadCount(data.data.filter(n => !n.isRead).length);
    }
  }, [data?.data, setUnreadCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
          headerRight: () => <InboxButton />,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="calendar" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { top: -4, right: -6 }]} >
                  <View style={styles.badgeInner} />
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    marginRight: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});
