/**
 * Tenant Profile Screen.
 *
 * Richly styled profile view showing the user's information, payment methods,
 * and settings. Includes a hidden dev utility: tapping the version number 5
 * times triggers a DB reset (to be wired up with mock db).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { Screen } from '@/components/ui/Screen';
import { useRouter } from 'expo-router';
import { typography, colors, spacing, borderRadius } from '@/constants/theme';
import { DevMenu } from '@/components/DevMenu';

export default function TenantProfileScreen() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const updateMutation = useUpdateProfile();
  const router = useRouter();
  const [devClicks, setDevClicks] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
  const [showDevMenu, setShowDevMenu] = useState(false);

  const handleEditPress = () => {
    if (user) {
      setEditForm({ fullName: user.fullName, phone: user.phone });
      setIsEditing(true);
    }
  };

  const handleSavePress = () => {
    if (user && editForm.fullName && editForm.phone) {
      updateMutation.mutate(
        { userId: user.id, data: editForm },
        {
          onSuccess: () => setIsEditing(false),
          onError: () => Alert.alert('Error', 'Failed to update profile'),
        }
      );
    }
  };

  const handleVersionClick = () => {
    const newCount = devClicks + 1;
    setDevClicks(newCount);
    if (newCount >= 5) {
      setDevClicks(0);
      setShowDevMenu(true);
    }
  };

  return (
    <Screen noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBg} />
        {/* Avatar & Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={editForm.fullName}
                onChangeText={(t) => setEditForm({ ...editForm, fullName: t })}
                placeholder="Full Name"
              />
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePress} style={styles.saveBtn} disabled={updateMutation.isPending}>
                  <Text style={styles.saveBtnText}>{updateMutation.isPending ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{user?.fullName}</Text>
                <TouchableOpacity onPress={handleEditPress}>
                  <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.phone}>{user?.phone}</Text>
              <View style={styles.roleChip}>
                <Text style={styles.roleText}>TENANT</Text>
              </View>
            </>
          )}
        </View>

        {/* Payment Methods Section (Requested by User) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment & Billing</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(tenant)/payment-methods' as any)}>
              <View style={styles.rowIcon}>
                <Ionicons name="card-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Payment Methods</Text>
                <Text style={styles.rowSubtitle}>Manage cards and mobile money</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(tenant)/billing' as any)}>
              <View style={styles.rowIcon}>
                <Ionicons name="receipt-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Billing History</Text>
                <Text style={styles.rowSubtitle}>View past transactions and receipts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(tenant)/notifications' as any)}>
              <View style={styles.rowIcon}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => logoutMutation.mutate()}>
              <View style={[styles.rowIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={22} color={colors.error} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.error }]}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleVersionClick} style={styles.versionContainer} activeOpacity={1}>
          <Text style={styles.versionText}>RentSure App v1.0.0 (Demo)</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDevMenu && (
        <DevMenu visible={showDevMenu} onClose={() => setShowDevMenu(false)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1250,
    backgroundColor: '#0B6E4F',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
    paddingHorizontal: spacing.lg,
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    textAlign: 'center',
  },
  email: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  phone: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  roleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.pill,
  },
  roleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#FFF',
    letterSpacing: 1,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.medium,
  },
  saveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
