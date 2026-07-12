import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminUsers, useSuspendUser, useReactivateUser } from '@/hooks/useAdmin';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { typography, colors, spacing, borderRadius, shadows } from '@/constants/theme';
import type { User, AdminUserFilters } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

function UserSkeleton() {
  return (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
          <Skeleton width={180} height={14} />
        </View>
        <Skeleton width={60} height={20} radius={borderRadius.pill} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={16} />
        <Skeleton width={70} height={24} />
      </View>
    </View>
  );
}

export default function AdminUsers() {
  const [filters, setFilters] = useState<AdminUserFilters>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data, isLoading, isRefetching, refetch } = useAdminUsers(filters);
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();

  const users = data?.data?.content || [];

  const handleToggleStatus = (user: User) => {
    const isSuspended = user.status === 'SUSPENDED';
    const action = isSuspended ? 'reactivate' : 'suspend';

    Alert.alert(
      `${isSuspended ? 'Reactivate' : 'Suspend'} User`,
      `Are you sure you want to ${action} ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspended ? 'Reactivate' : 'Suspend',
          style: isSuspended ? 'default' : 'destructive',
          onPress: () => {
            if (isSuspended) {
              reactivateMutation.mutate(user.id, {
                onSuccess: (res) => {
                  if (!res.success) Alert.alert('Error', res.error?.message ?? 'Action failed');
                }
              });
            } else {
              suspendMutation.mutate(user.id, {
                onSuccess: (res) => {
                  if (!res.success) Alert.alert('Error', res.error?.message ?? 'Action failed');
                }
              });
            }
          },
        },
      ]
    );
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => setSelectedUser(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'LANDLORD' ? '#F0FDF4' : '#EFF6FF' }]}>
          <Text style={[styles.roleText, { color: item.role === 'LANDLORD' ? '#16A34A' : '#2563EB' }]}>
            {item.role}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'ACTIVE' ? colors.success : colors.error }]} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        {item.role !== 'ADMIN' && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => handleToggleStatus(item)}
            disabled={suspendMutation.isPending || reactivateMutation.isPending}
          >
            <Text style={[styles.actionBtnText, { color: item.status === 'ACTIVE' ? colors.error : colors.success }]}>
              {item.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen noPadding>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={filters.search}
            onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => <UserSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={renderUserCard}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedUser(null)}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>User Details</Text>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{selectedUser.fullName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{selectedUser.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{selectedUser.role}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{selectedUser.status}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Verification Status</Text>
                <Text style={styles.detailValue}>{selectedUser.verificationStatus || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created At</Text>
                <Text style={styles.detailValue}>{new Date(selectedUser.createdAt).toLocaleString()}</Text>
              </View>

              {selectedUser.role !== 'ADMIN' && (
                <Button 
                  title={selectedUser.status === 'ACTIVE' ? 'Suspend User' : 'Reactivate User'}
                  onPress={() => {
                    handleToggleStatus(selectedUser);
                    setSelectedUser(null);
                  }}
                  style={{ marginTop: spacing.xl, backgroundColor: selectedUser.status === 'ACTIVE' ? colors.error : colors.success }}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
    gap: spacing.md,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  roleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
});
