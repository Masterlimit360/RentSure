/**
 * Paystack Sandbox Screen.
 *
 * This screen is ONLY used in the mock environment to simulate Paystack's
 * hosted checkout page. It allows us to test the webhook flow and polling
 * logic without actually hitting Paystack.
 *
 * Clicking "Pay" triggers `mockPayBooking`, which simulates the server-side
 * webhook handling (transitions booking to PAID_ESCROW, creates Payment record).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mockPayBooking } from '@/mocks/bookings.mock';
import { db } from '@/mocks/store';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';

export default function PaystackSandboxScreen() {
  const { bookingId, ref } = useLocalSearchParams<{ bookingId: string; ref: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);

  // Read directly from mock db for the sandbox UI
  const booking = db.bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return (
      <Screen>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Booking not found</Text>
      </Screen>
    );
  }

  const rent = booking.totalAmount;
  const fee = rent * 0.05; // Note: In the mock we use 5% for the tenant view
  const total = rent + fee;

  const handlePay = async () => {
    setLoading(true);
    // This simulates the webhook hitting our backend
    const res = await mockPayBooking(bookingId as string);
    setLoading(false);

    if (res.success) {
      // Go back to the payment polling screen, which should now pick up the PAID_ESCROW status
      router.back();
    } else {
      Alert.alert('Payment Failed', res.error?.message || 'Unknown error');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Screen noPadding>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Ionicons name="card" size={24} color="#0BA4DB" />
          <Text style={styles.headerText}>Paystack Sandbox</Text>
        </View>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
          <Text style={styles.closeText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.merchantName}>RentSure Escrow</Text>
          <Text style={styles.userEmail}>test@example.com</Text>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Pay</Text>
            <Text style={styles.amountValue}>{formatCurrency(total)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.demoWarning}>
            This is a mock payment screen. No real money will be charged.
          </Text>

          <Button 
            title="Success" 
            onPress={handlePay} 
            isLoading={loading}
            style={styles.payBtn}
          />
          <Button 
            title="Fail" 
            onPress={handleCancel}
            variant="outline"
          />
        </View>

        <Text style={styles.refText}>Ref: {ref}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#0F172A',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    padding: spacing.lg,
    alignItems: 'center',
    paddingTop: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  merchantName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#0F172A',
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: '#0BA4DB',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  demoWarning: {
    fontSize: typography.sizes.sm,
    color: '#B45309',
    textAlign: 'center',
    marginBottom: spacing.lg,
    backgroundColor: '#FEF3C7',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  payBtn: {
    width: '100%',
    backgroundColor: '#0BA4DB',
    marginBottom: spacing.md,
  },
  refText: {
    marginTop: spacing.xl,
    fontSize: 12,
    color: '#94A3B8',
  }
});
