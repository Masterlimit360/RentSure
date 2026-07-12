/**
 * Developer Tools bottom sheet.
 *
 * In MOCK mode: shows full QA toolkit (reset DB, time shift, account switch, row counts).
 * In LIVE mode: hides all mock-specific actions; only shows the mode badge
 * and a link to the Supabase dashboard for debugging.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { db, resetDb, flushDb } from '@/mocks/store';
import { typography, colors, spacing, borderRadius } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { USE_MOCKS, IS_LIVE } from '@/api/client';
import { supabase } from '@/api/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface DevMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DevMenu({ visible, onClose }: DevMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleResetDb = () => {
    Alert.alert('Reset DB', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        await resetDb();
        useAuthStore.getState().clearAuth();
        onClose();
        Alert.alert('Success', 'Mock DB reset to factory defaults.');
      }}
    ]);
  };

  /**
   * In live mode, logging out also clears the TanStack Query cache
   * so no stale Supabase data lingers between accounts.
   */
  const handleLiveLogout = async () => {
    Alert.alert('Log Out', 'Sign out and clear cache?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        queryClient.clear();
        useAuthStore.getState().clearAuth();
        onClose();
        router.replace('/(auth)/login' as any);
      }}
    ]);
  };

  const handleSwitchAccount = (userId: string, role: string) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      const fakeToken = `mock-access-${user.id}-${Date.now()}`;
      const fakeRefresh = `mock-refresh-${user.id}-${Date.now()}`;
      useAuthStore.getState().setAuth(user, fakeToken, fakeRefresh);
      onClose();
      if (role === 'TENANT') router.replace('/(tenant)/' as any);
      else if (role === 'LANDLORD') router.replace('/(landlord)/' as any);
      else if (role === 'ADMIN') router.replace('/(admin)/' as any);
      Alert.alert('Account Switched', `Logged in as ${user.fullName} (${role})`);
    }
  };

  const handleSimulateTime = async () => {
    let changed = 0;
    const shiftMs = 73 * 60 * 60 * 1000;
    const now = Date.now();
    
    db.bookings.forEach(b => {
      if (b.status === 'ACCEPTED') {
        const d = new Date(b.requestedAt);
        const newTime = d.getTime() - shiftMs;
        b.requestedAt = new Date(newTime).toISOString();
        changed++;
      }
    });

    if (changed > 0) {
      await flushDb();
      const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;
      let expired = 0;
      db.bookings.forEach(b => {
        if (b.status === 'ACCEPTED') {
          const age = now - new Date(b.requestedAt).getTime();
          if (age > SEVENTY_TWO_HOURS) {
            b.status = 'EXPIRED';
            expired++;
          }
        }
      });
      if (expired > 0) await flushDb();
    }
    
    onClose();
    Alert.alert('Time Shifted', `Shifted 73h. ${changed} bookings updated.`);
  };

  const handleViewCounts = () => {
    const msg = `
Users: ${db.users.length}
Properties: ${db.properties.length}
Bookings: ${db.bookings.length}
Payments: ${db.payments.length}
Agreements: ${db.agreements.length}
Reviews: ${db.reviews.length}
Verifications: ${db.verifications.length}
Notifications: ${db.notifications.length}
    `.trim();
    Alert.alert('DB Row Counts', msg);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Developer Tools</Text>
              <View style={[styles.modeBadge, { backgroundColor: USE_MOCKS ? colors.warning + '20' : colors.success + '20' }]}>
                <Text style={[styles.modeBadgeText, { color: USE_MOCKS ? colors.warning : colors.success }]}>
                  {USE_MOCKS ? '🧪 Mock Mode' : '🟢 Live (Supabase)'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ---- LIVE-MODE ACTIONS ---- */}
            {IS_LIVE && (
              <>
                <Text style={styles.sectionTitle}>Live Mode</Text>
                <TouchableOpacity style={styles.actionRow} onPress={handleLiveLogout}>
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Log Out & Clear Cache</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ---- MOCK-ONLY ACTIONS (hidden in live mode) ---- */}
            {USE_MOCKS && (
              <>
                <Text style={styles.sectionTitle}>Global Actions</Text>
                <TouchableOpacity style={styles.actionRow} onPress={handleResetDb}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Reset Mock DB</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionRow} onPress={handleSimulateTime}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>Simulate +73h (Trigger Expiry)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={handleViewCounts}>
                  <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>View DB Row Counts</Text>
                </TouchableOpacity>

                {/* Fast Account Switching — mock only */}
                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Fast Account Switch</Text>
                {db.users.map(u => (
                  <TouchableOpacity key={u.id} style={styles.userRow} onPress={() => handleSwitchAccount(u.id, u.role)}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{u.fullName[0]}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.fullName}</Text>
                      <Text style={styles.userRole}>{u.role}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modeBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: {
    marginLeft: spacing.md,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#0284C7',
    fontWeight: typography.weights.bold,
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  userRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
