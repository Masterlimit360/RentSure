/**
 * Landlord Profile Screen.
 *
 * Richly styled profile view showing the user's information, payout accounts,
 * and settings. Includes a hidden dev utility: tapping the version number 5
 * times triggers a DB reset.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/auth.store';
import { useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { Screen } from '@/components/ui/Screen';
import { typography, colors, spacing, borderRadius } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { DevMenu } from '@/components/DevMenu';

export default function LandlordProfileScreen() {
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
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileCard}>
          <View style={styles.profileCardContent}>
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
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{user?.fullName}</Text>
                  <TouchableOpacity onPress={handleEditPress} style={styles.editBtn}>
                    <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
                <Text style={styles.phone} numberOfLines={1}>{user?.phone}</Text>
                <View style={styles.roleChip}>
                  <Text style={styles.roleText}>LANDLORD</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {user?.verificationStatus !== 'APPROVED' && (
          <View style={styles.unverifiedBanner}>
            <Ionicons name={user?.verificationStatus === 'PENDING' ? 'time-outline' : 'alert-circle'} size={24} color="#B45309" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>
                {user?.verificationStatus === 'PENDING' ? 'Verification Pending' : 'Account not verified'}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {user?.verificationStatus === 'PENDING' 
                  ? 'Your documents are being reviewed by an admin.'
                  : 'Verify your identity to unlock all landlord features.'}
              </Text>
            </View>
            {user?.verificationStatus !== 'PENDING' && (
              <TouchableOpacity style={styles.verifyBtn} onPress={() => router.push('/(landlord)/verify' as any)}>
                <Text style={styles.verifyBtnText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Dashboard Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(landlord)/performance' as any)}>
              <View style={styles.rowIcon}>
                <Ionicons name="stats-chart-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Performance & Earnings</Text>
                <Text style={styles.rowSubtitle}>View stats and active escrow</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Financials Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financials</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(landlord)/payment-methods' as any)}>
              <View style={styles.rowIcon}>
                <Ionicons name="wallet-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Payout Accounts</Text>
                <Text style={styles.rowSubtitle}>Manage where you receive rent</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(landlord)/billing' as any)}>
              <View style={styles.rowIcon}>
                <Ionicons name="receipt-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Billing History</Text>
                <Text style={styles.rowSubtitle}>View past escrow payouts and receipts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={handleEditPress}>
              <View style={styles.rowIcon}>
                <Ionicons name="person-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Personal Information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(landlord)/notifications' as any)}>
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
    backgroundColor: '#1E293B', // Darker slate for landlords
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    width: '100%',
  },
  name: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  editBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  email: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
    width: '100%',
  },
  phone: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    width: '100%',
  },
  roleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
  },
  roleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    letterSpacing: 1,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: typography.weights.medium,
  },
  saveBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  unverifiedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bannerTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  bannerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#92400E',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  verifyBtn: {
    backgroundColor: '#B45309',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
  verifyBtnText: {
    color: '#FFF',
    fontSize: typography.sizes.sm,
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
