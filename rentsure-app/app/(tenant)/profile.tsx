/**
 * Tenant Profile Screen.
 *
 * Richly styled profile view showing the user's information, payment methods,
 * and settings. Includes a hidden dev utility: tapping the version number 5
 * times triggers a DB reset (to be wired up with mock db).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import Animated, { FadeInUp, FadeInDown, FadeIn } from 'react-native-reanimated';
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
        <Animated.View entering={FadeIn.duration(500)} style={styles.headerBg} />
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

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                {isEditing ? (
                  <TextInput
                    style={[styles.name, styles.inlineInput]}
                    value={editForm.fullName}
                    onChangeText={(t) => setEditForm({ ...editForm, fullName: t })}
                    placeholder="Full Name"
                    autoFocus
                  />
                ) : (
                  <Text style={styles.name} numberOfLines={1}>{user?.fullName}</Text>
                )}
                
                {isEditing ? (
                  <View style={styles.actionIconRow}>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconBtn}>
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSavePress} style={styles.iconBtn} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleEditPress} style={styles.editBtn}>
                    <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {isEditing ? (
                <TextInput
                  style={[styles.phone, styles.inlineInput]}
                  value={editForm.phone}
                  onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.phone} numberOfLines={1}>{user?.phone || 'No phone set'}</Text>
              )}
              
              <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
              
              <View style={styles.roleChip}>
                <Text style={styles.roleText}>TENANT</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Payment Methods Section (Requested by User) */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
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
        </Animated.View>

        {/* Settings Section */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(tenant)/preferences' as any)}>
              <View style={styles.rowIcon}>
                <Ionicons name="options-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>My Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.divider} />
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
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <TouchableOpacity onPress={handleVersionClick} style={styles.versionContainer} activeOpacity={1}>
            <Text style={styles.versionText}>RentSure App v1.0.0 (Demo)</Text>
          </TouchableOpacity>
        </Animated.View>
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
  inlineInput: {
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flex: 1,
  },
  actionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 2,
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
