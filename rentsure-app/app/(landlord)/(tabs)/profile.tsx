/**
 * Landlord Profile Screen.
 *
 * Richly styled profile view showing the user's information, payout accounts,
 * and settings. Includes a hidden dev utility: tapping the version number 5
 * times triggers a DB reset.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store/auth.store';
import { useLogout, useUpdateProfile } from '@/hooks/useAuth';
import { useLandlordVerifications } from '@/hooks/useVerification';
import { useProperties } from '@/hooks/useProperties';
import { Screen } from '@/components/ui/Screen';
import { typography, colors, spacing, borderRadius } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { DevMenu } from '@/components/DevMenu';

export default function LandlordProfileScreen() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const updateMutation = useUpdateProfile();
  const router = useRouter();
  
  const { data: verificationsData } = useLandlordVerifications(user?.id || '');
  const { data: propertiesData } = useProperties({});
  
  const existingVerifications = verificationsData?.data || [];
  const myProperties = (propertiesData?.data?.content ?? []).filter(p => p.landlordId === user?.id);
  const verifiedPropertiesCount = myProperties.filter(p => p.isVerified).length;
  
  const identityStatus = user?.isVerified 
    ? 'APPROVED' 
    : existingVerifications.find(v => !v.propertyId)?.status || 'NONE';
  const identityReason = existingVerifications.find(v => !v.propertyId && v.status === 'REJECTED')?.rejectionReason;
  
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
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              {isEditing ? (
                <TextInput
                  style={[styles.name, styles.inlineInput]}
                  value={editForm.fullName}
                  onChangeText={(t) => setEditForm({ ...editForm, fullName: t })}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoFocus
                  textAlign="center"
                />
              ) : (
                <Text style={styles.name} numberOfLines={1}>{user?.fullName}</Text>
              )}
              
              {isEditing ? (
                <View style={styles.actionIconRow}>
                  <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconBtn}>
                    <Ionicons name="close-circle" size={28} color={colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSavePress} style={styles.iconBtn} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={handleEditPress} style={styles.editBtn}>
                  <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <TextInput
                style={[styles.phone, styles.inlineInput, { marginTop: 4 }]}
                value={editForm.phone}
                onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                placeholder="Phone Number"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="phone-pad"
                textAlign="center"
              />
            ) : (
              <Text style={styles.phone} numberOfLines={1}>{user?.phone || 'No phone set'}</Text>
            )}
            
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
            
            <View style={styles.roleChip}>
              <Text style={styles.roleText}>LANDLORD</Text>
            </View>
          </View>
        </Animated.View>

        {/* Verification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, identityStatus === 'APPROVED' ? { backgroundColor: '#D1FAE5' } : identityStatus === 'REJECTED' ? { backgroundColor: '#FEE2E2' } : identityStatus === 'PENDING' ? { backgroundColor: '#FEF3C7' } : {}]}>
                <Ionicons 
                  name={identityStatus === 'APPROVED' ? 'checkmark' : identityStatus === 'PENDING' ? 'time' : identityStatus === 'REJECTED' ? 'close' : 'shield-half'} 
                  size={22} 
                  color={identityStatus === 'APPROVED' ? colors.success : identityStatus === 'PENDING' ? colors.warning : identityStatus === 'REJECTED' ? colors.error : colors.primary} 
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Identity</Text>
                <Text style={styles.rowSubtitle}>
                  {identityStatus === 'APPROVED' ? 'Verified' : identityStatus === 'PENDING' ? 'Under Review' : identityStatus === 'REJECTED' ? `Rejected: ${identityReason || 'Check documents'}` : 'Not verified'}
                </Text>
              </View>
              {identityStatus !== 'APPROVED' && identityStatus !== 'PENDING' && (
                <TouchableOpacity style={styles.verifyBtnSm} onPress={() => router.push({ pathname: '/(landlord)/verify', params: { mode: 'identity' } } as any)}>
                  <Text style={styles.verifyBtnTextSm}>Verify</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => router.push('/(landlord)' as any)}>
              <View style={[styles.rowIcon, verifiedPropertiesCount > 0 ? { backgroundColor: '#D1FAE5' } : {}]}>
                <Ionicons name="home-outline" size={22} color={verifiedPropertiesCount > 0 ? colors.success : colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Properties</Text>
                <Text style={styles.rowSubtitle}>{verifiedPropertiesCount} of {myProperties.length} verified</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: -60,
    width: '100%',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    flexShrink: 1,
    textAlign: 'center',
  },
  phone: {
    fontSize: typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 9999,
  },
  roleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#FFF',
    letterSpacing: 1.5,
  },
  inlineInput: {
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: colors.surface,
  },
  actionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  iconBtn: {
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  editBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    marginLeft: 8,
  },
  verifyBtnSm: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  verifyBtnTextSm: {
    color: '#FFF',
    fontSize: typography.sizes.xs,
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
