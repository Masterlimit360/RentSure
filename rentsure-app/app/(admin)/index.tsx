import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { useAdminUsers, useAdminVerifications } from '@/hooks/useAdmin';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  const { data: usersData, isLoading: isLoadingUsers } = useAdminUsers({});
  const { data: verificationsData, isLoading: isLoadingVerifications } = useAdminVerifications();

  const users = usersData?.data?.content || [];
  const verifications = verificationsData?.data?.content || [];

  const pendingVerifications = verifications.filter((v) => v.status === 'PENDING').length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const totalLandlords = users.filter((u) => u.role === 'LANDLORD').length;
  const totalTenants = users.filter((u) => u.role === 'TENANT').length;

  return (
    <Screen noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>{user?.fullName}</Text>
          <Text style={styles.adminRole}>System Administrator</Text>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{isLoadingUsers ? '-' : users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#DC2626" />
            </View>
            <Text style={styles.statValue}>{isLoadingVerifications ? '-' : pendingVerifications}</Text>
            <Text style={styles.statLabel}>Pending Verifications</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="home" size={24} color="#16A34A" />
            </View>
            <Text style={styles.statValue}>{isLoadingUsers ? '-' : totalLandlords}</Text>
            <Text style={styles.statLabel}>Landlords</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="person" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.statValue}>{isLoadingUsers ? '-' : totalTenants}</Text>
            <Text style={styles.statLabel}>Tenants</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => logoutMutation.mutate()} 
          disabled={logoutMutation.isPending}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: 80,
  },
  welcomeCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: typography.sizes.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  adminName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  adminRole: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: colors.error,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
});
