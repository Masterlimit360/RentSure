/**
 * Shared Notifications Inbox Screen.
 *
 * Lists all notifications for the current user. Unread notifications have a
 * left border highlight and bolder text. The screen automatically marks all
 * notifications as read when focused.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNotifications, useMarkAllRead, useClearAllNotifications, useDeleteNotification } from '@/hooks/useNotifications';
import { useNotificationsStore } from '@/store/notifications.store';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import type { Notification } from '@/types';

interface NotificationsScreenProps {
  userId: string;
}

export function NotificationsScreen({ userId }: NotificationsScreenProps) {
  const { data, isLoading, isRefetching, refetch } = useNotifications(userId);
  const markReadMutation = useMarkAllRead();
  const clearMutation = useClearAllNotifications();
  const deleteMutation = useDeleteNotification();
  const { setUnreadCount, clearUnread } = useNotificationsStore();

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Update badge count in Zustand whenever we fetch new notifications
  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount, setUnreadCount]);

  // Mark all as read when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (unreadCount > 0) {
        markReadMutation.mutate(userId, {
          onSuccess: () => {
            clearUnread();
            refetch();
          },
        });
      }
    }, [userId, unreadCount, markReadMutation, clearUnread, refetch])
  );

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Clear', 
        style: 'destructive',
        onPress: () => {
          clearMutation.mutate(userId, {
            onSuccess: () => {
              clearUnread();
              refetch();
            }
          });
        }
      }
    ]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'BOOKING_REQUESTED':
      case 'BOOKING_ACCEPTED':
      case 'BOOKING_REJECTED':
        return 'calendar-outline';
      case 'PAYMENT_RECEIVED':
        return 'cash-outline';
      case 'MOVE_IN_CONFIRMED':
        return 'home-outline';
      case 'REVIEW_RECEIVED':
        return 'star-outline';
      case 'AGREEMENT_SIGNED':
        return 'document-text-outline';
      default:
        return 'notifications-outline';
    }
  };

  if (isLoading && !data) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen noPadding>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn} disabled={clearMutation.isPending}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyBody}>You have no notifications right now.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInUp.delay(index * 100).springify()}
            layout={LinearTransition.springify()}
          >
            <Swipeable
              renderRightActions={() => (
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => deleteMutation.mutate({ notificationId: item.id, userId }, { onSuccess: () => refetch() })}
                >
                  <Ionicons name="trash" size={24} color="#FFF" />
                </TouchableOpacity>
              )}
              onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                  deleteMutation.mutate({ notificationId: item.id, userId }, { onSuccess: () => refetch() });
                }
              }}
            >
              <View style={[styles.card, !item.isRead && styles.cardUnread]}>
                <View style={styles.iconBox}>
                  <Ionicons name={getIcon(item.type)} size={20} color={colors.primary} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Swipeable>
          </Animated.View>
        )}
      />
    </Screen>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between
  },
  topBarTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  clearBtn: {
    padding: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    gap: spacing.md,
  },
  cardUnread: {
    borderLeftColor: colors.primary,
    backgroundColor: '#F8FAFC',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: 4,
  },
  titleUnread: {
    fontWeight: typography.weights.bold,
  },
  body: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  emptyBody: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: spacing.md,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
});
