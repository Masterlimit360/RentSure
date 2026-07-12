import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useBillingHistory } from '@/hooks/usePayments';
import { Screen } from '@/components/ui/Screen';
import { typography, colors, spacing, borderRadius } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { useRouter } from 'expo-router';
import type { Payment } from '@/types';

interface Props {
  role: 'TENANT' | 'LANDLORD';
}

export function BillingHistoryScreen({ role }: Props) {
  const { user } = useAuthStore();
  const { data: response, isLoading, isError } = useBillingHistory(user?.id, role);
  const router = useRouter();

  const renderItem = ({ item }: { item: Payment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={role === 'TENANT' ? "arrow-up-circle" : "arrow-down-circle"} 
            size={24} 
            color={role === 'TENANT' ? colors.primary : colors.success} 
          />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.date}>{formatDate(item.paidAt)}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.escrowStatus === 'RELEASED' ? colors.success : colors.accent }
        ]}>
          <Text style={styles.statusText}>{item.escrowStatus}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardFooter}>
        <Text style={styles.refLabel}>Ref: {item.paystackRef}</Text>
        <Text style={styles.feeLabel}>Fee: {formatCurrency(item.fee)}</Text>
      </View>
    </View>
  );

  return (
    <Screen noPadding>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Billing History</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>
          {role === 'TENANT' ? 'Your past payments and deposits' : 'Your received rent payouts'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load billing history.</Text>
        </View>
      ) : (
        <FlatList
          data={response?.data || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No billing history yet.</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  backBtn: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  cardHeaderContent: {
    flex: 1,
  },
  amount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  date: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  refLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  feeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
  },
});
