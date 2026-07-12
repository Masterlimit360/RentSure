import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminBookings, useReleaseEscrow } from '@/hooks/useAdmin';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { typography, colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Booking } from '@/types';

export default function AdminPayouts() {
  const { data, isLoading, isRefetching, refetch } = useAdminBookings();
  const releaseMutation = useReleaseEscrow();
  const [searchQuery, setSearchQuery] = useState('');

  const allBookings = data?.data || [];
  // Admin needs to see MOVED_IN to release funds, or PAID_ESCROW to monitor.
  // We'll show all and allow releasing if it's MOVED_IN or PAID_ESCROW (with warning).
  const payoutsList = allBookings.filter(
    (b) => b.status === 'MOVED_IN' || b.status === 'PAID_ESCROW' || b.status === 'COMPLETED'
  );

  const handleRelease = (booking: Booking) => {
    Alert.alert(
      'Release Escrow Funds',
      `Are you sure you want to release the funds for booking ${booking.bookingRef}? This will transfer ${formatCurrency(booking.totalAmount)} to the landlord.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Funds',
          style: 'destructive',
          onPress: () => {
            releaseMutation.mutate(booking.id, {
              onSuccess: (res) => {
                if (res.success) {
                  Alert.alert('Success', 'Funds have been released to the landlord.');
                } else {
                  Alert.alert('Error', res.error?.message ?? 'Failed to release funds');
                }
              }
            });
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.refText}>{item.bookingRef}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: item.status === 'COMPLETED' ? '#065F46' : '#92400E' }]}>
            {item.status === 'COMPLETED' ? 'RELEASED' : 'HELD IN ESCROW'}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>Amount:</Text>
        <Text style={styles.detailValue}>{formatCurrency(item.totalAmount)}</Text>
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>State:</Text>
        <Text style={styles.detailValue}>{item.status}</Text>
      </View>

      {item.status !== 'COMPLETED' && (
        <Button 
          title="Release Payment to Landlord" 
          onPress={() => handleRelease(item)} 
          isLoading={releaseMutation.isPending}
          style={styles.releaseBtn}
        />
      )}
    </View>
  );

  return (
    <Screen noPadding>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading escrows...</Text>
      ) : (
        <FlatList
          data={payoutsList}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No escrow payments to manage.</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  refText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  releaseBtn: {
    marginTop: spacing.md,
    marginBottom: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    color: colors.textSecondary,
  }
});
