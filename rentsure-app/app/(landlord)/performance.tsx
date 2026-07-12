import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useMyBookings } from '@/hooks/useBookings';
import { formatCurrency } from '@/utils/format';

export default function PerformanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: bookingsData } = useMyBookings(user?.id ?? '', 'LANDLORD');

  const bookings = bookingsData?.data || [];

  const stats = useMemo(() => {
    let totalEarned = 0;
    let pendingEscrow = 0;
    let activeBookings = 0;

    bookings.forEach((b) => {
      if (b.status === 'COMPLETED' || b.status === 'MOVED_IN') {
        totalEarned += b.totalAmount;
      }
      if (b.status === 'PAID_ESCROW') {
        pendingEscrow += b.totalAmount;
      }
      if (['ACCEPTED', 'PAID_ESCROW', 'MOVED_IN'].includes(b.status)) {
        activeBookings++;
      }
    });

    return { totalEarned, pendingEscrow, activeBookings };
  }, [bookings]);

  return (
    <Screen noPadding>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance & Earnings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Lifetime Earnings</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats.totalEarned)}</Text>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up" size={16} color={colors.success} />
            <Text style={styles.trendText}>+12.5% vs last month</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="lock-closed" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.gridLabel}>In Escrow</Text>
            <Text style={styles.gridValue}>{formatCurrency(stats.pendingEscrow)}</Text>
          </View>

          <View style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="people" size={20} color="#16A34A" />
            </View>
            <Text style={styles.gridLabel}>Active Tenants</Text>
            <Text style={styles.gridValue}>{stats.activeBookings}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {bookings.slice(0, 5).map((b) => (
            <View key={b.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons 
                  name={b.status === 'PAID_ESCROW' ? 'time' : 'checkmark-circle'} 
                  size={20} 
                  color={b.status === 'PAID_ESCROW' ? colors.warning : colors.success} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {b.status === 'PAID_ESCROW' ? 'Payment in Escrow' : 'Payment Released'}
                </Text>
                <Text style={styles.activitySubtitle}>{b.propertyTitle || 'Property'} • {b.tenantName}</Text>
              </View>
              <Text style={styles.activityAmount}>{formatCurrency(b.totalAmount)}</Text>
            </View>
          ))}
          {bookings.length === 0 && (
            <Text style={styles.emptyText}>No recent activity found.</Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: '#FFF',
    marginBottom: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: typography.weights.medium,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gridItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gridLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  activityList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIcon: {
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  activitySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  emptyText: {
    padding: spacing.xl,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
