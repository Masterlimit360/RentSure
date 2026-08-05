import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useAttentionCounts } from '@/hooks/useAttentionCounts';

function InboxButton() {
  const { unreadNotifications } = useAttentionCounts();
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push('/(landlord)/notifications')} style={styles.headerBtn}>
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unreadNotifications > 0 && (
        <View style={styles.badge}>
          <View style={styles.badgeInner} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function LandlordLayout() {
  const { landlordActionableCount, unreadNotifications } = useAttentionCounts();

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
          title: 'My Listings',
          headerRight: () => <InboxButton />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail" size={size} color={color} />
          ),
          tabBarBadge: landlordActionableCount > 0 ? landlordActionableCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
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
