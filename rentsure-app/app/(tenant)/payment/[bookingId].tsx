/**
 * Payment Screen — Summary → Checkout → Receipt.
 *
 * This screen drives the entire payment lifecycle from the tenant's side.
 * It has three internal stages controlled by `stage`:
 *
 *   'summary'    — shows the fee breakdown and escrow explainer before commit
 *   'processing' — calls Paystack, opens WebBrowser, polls for PAID_ESCROW status
 *   'receipt'    — shows a receipt-style card confirming escrow is HELD
 *
 * IMPORTANT: The frontend NEVER verifies payments itself. It only requests
 * initialization, presents the checkout URL returned by the backend, and polls
 * the backend for the final status. The backend relies exclusively on Paystack
 * webhooks to securely verify payments. No secret keys are stored here.
 *
 * The mock transitions the booking immediately on initializePayment, so the
 * polling will resolve on the first tick in development.
 */


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PaystackCheckout } from '@/components/PaystackCheckout';
import { recordRealPayment } from '@/api/payments.api';
import { useInitializePayment, usePaymentStatus } from '@/hooks/usePayments';
import { useMyBookings } from '@/hooks/useBookings';
import { useAuthStore } from '@/store/auth.store';
import { mockPayBooking } from '@/mocks/bookings.mock';
import { USE_MOCKS } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Booking } from '@/types';

const SERVICE_FEE_RATE = 0.05; // 5% RentSure service fee, displayed to tenant before payment
const POLL_TIMEOUT_MS = 60_000;  // Give up polling after 60s; show manual "check status" button

type Stage = 'summary' | 'processing' | 'receipt';

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [stage, setStage] = useState<Stage>('summary');
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const [isCheckoutVisible, setCheckoutVisible] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: bookingsData } = useMyBookings(user?.id ?? '', 'TENANT');
  const initMutation = useInitializePayment();
  const { data: statusData } = usePaymentStatus(
    bookingId ?? '',
    pollingEnabled ? 3000 : false
  );

  const booking: Booking | undefined = bookingsData?.data?.find((b) => b.id === bookingId);
  const rent = booking?.totalAmount ?? 0;
  const serviceFee = Math.round(rent * SERVICE_FEE_RATE);
  const total = rent + serviceFee;
  const amountPesewas = Math.round(total * 100);

  // When polling resolves with HELD or PENDING_VERIFICATION status, advance to receipt
  useEffect(() => {
    if (
      (statusData?.data?.escrowStatus === 'HELD' || statusData?.data?.escrowStatus === 'PENDING_VERIFICATION') &&
      stage === 'processing'
    ) {
      setPollingEnabled(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStage('receipt');
    }
  }, [statusData, stage]);

  const handlePayNow = async () => {
    if (!bookingId) return;
    if (USE_MOCKS) {
      // Trigger mock flow directly
      handlePaystackSuccess('MOCK_REF_' + Date.now());
    } else {
      setCheckoutVisible(true);
    }
  };

  const handlePaystackSuccess = async (res: any) => {
    setStage('processing');
    setCheckoutVisible(false);
    
    // Client-reported success is provisional.
    // Integration phase: backend webhook + verify (sk) flips PENDING_VERIFICATION → HELD 
    // and becomes the only trusted path. Do not build any feature that irreversibly trusts PENDING_VERIFICATION.
    if (USE_MOCKS) {
      await mockPayBooking(bookingId!);
    } else {
      const ref = typeof res === 'string' ? res : (res.reference || 'unknown');
      await recordRealPayment(bookingId!, amountPesewas, ref);
    }
    
    setPollingEnabled(true);
    timeoutRef.current = setTimeout(() => {
      setPollingEnabled(false);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);
  };

  const handlePaystackCancel = () => {
    setCheckoutVisible(false);
    Alert.alert('Payment Cancelled', 'You cancelled the transaction.');
  };

  const handleManualCheck = () => {
    setTimedOut(false);
    setPollingEnabled(true);
    timeoutRef.current = setTimeout(() => {
      setPollingEnabled(false);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);
  };

  if (!booking) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen noPadding>
      {/* Back nav */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {stage === 'receipt' ? 'Payment Receipt' : 'Payment'}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ─── SUMMARY STAGE ─── */}
        {stage === 'summary' && (
          <>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.lineItems}>
              <View style={styles.lineRow}>
                <Text style={styles.lineLabel}>Annual Rent</Text>
                <Text style={styles.lineValue}>{formatCurrency(rent)}</Text>
              </View>
              <View style={styles.lineRow}>
                <Text style={styles.lineLabel}>RentSure Service Fee (5%)</Text>
                <Text style={styles.lineValue}>{formatCurrency(serviceFee)}</Text>
              </View>
              <View style={[styles.lineRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>

            {/* Escrow explainer — critical for tenant trust */}
            <View style={styles.escrowCard}>
              <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
              <View style={styles.escrowTextBlock}>
                <Text style={styles.escrowTitle}>Your money is safe</Text>
                <Text style={styles.escrowBody}>
                  Your payment is held securely by RentSure in escrow. The landlord only receives
                  funds after you confirm you have physically moved in.
                </Text>
              </View>
            </View>

            <Text style={styles.refNote}>Ref: {booking.bookingRef}</Text>

            <Button
              title="Pay with Paystack"
              onPress={handlePayNow}
              style={styles.cta}
            />

            <PaystackCheckout  
              visible={isCheckoutVisible}
              paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_KEY || "pk_test_dummy"}
              email={user?.email || "tenant@rentsure.com"}
              amountPesewas={amountPesewas}
              reference={booking.bookingRef + '_' + Date.now()}
              bookingId={bookingId!}
              onCancel={handlePaystackCancel}
              onSuccess={handlePaystackSuccess}
            />
          </>
        )}

        {/* ─── PROCESSING STAGE ─── */}
        {stage === 'processing' && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingTitle}>Confirming Payment…</Text>
            <Text style={styles.processingBody}>
              Please complete your payment in the browser. This screen will update automatically.
            </Text>

            {timedOut && (
              <>
                <Text style={styles.timeoutText}>
                  Taking longer than expected. If you've completed the payment, tap below.
                </Text>
                <Button
                  title="I've Paid — Check Status"
                  onPress={handleManualCheck}
                  style={styles.cta}
                />
              </>
            )}
          </View>
        )}

        {/* ─── RECEIPT STAGE ─── */}
        {stage === 'receipt' && statusData?.data && (
          <>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
              <Text style={styles.successTitle}>Payment Successful</Text>
            </View>

            <View style={styles.receiptCard}>
              <Text style={styles.receiptHeader}>Receipt</Text>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Booking Ref</Text>
                <Text style={styles.receiptValue}>{booking.bookingRef}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Amount Paid</Text>
                <Text style={styles.receiptValue}>{formatCurrency(statusData.data.amount)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Date</Text>
                <Text style={styles.receiptValue}>
                  {new Date(statusData.data.paidAt).toLocaleDateString('en-GH', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptKey}>Escrow Status</Text>
                {statusData.data.escrowStatus === 'PENDING_VERIFICATION' ? (
                  <View style={[styles.heldBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.heldBadgeText, { color: colors.warning }]}>PENDING</Text>
                  </View>
                ) : (
                  <View style={styles.heldBadge}>
                    <Text style={styles.heldBadgeText}>HELD</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.escrowCard}>
              <Ionicons name="lock-closed" size={24} color={colors.primary} />
              <View style={styles.escrowTextBlock}>
                <Text style={styles.escrowTitle}>Funds in escrow</Text>
                {statusData.data.escrowStatus === 'PENDING_VERIFICATION' ? (
                  <Text style={styles.escrowBody}>
                    Payment received — confirmation pending. We will verify your payment with Paystack momentarily.
                  </Text>
                ) : (
                  <Text style={styles.escrowBody}>
                    Your payment is secured. Sign the rental agreement and confirm move-in
                    to release funds to your landlord.
                  </Text>
                )}
              </View>
            </View>

            <Button
              title="Back to My Bookings"
              onPress={() => router.replace('/(tenant)/bookings' as any)}
              style={styles.cta}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: spacing.xs },
  topBarTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  lineItems: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineLabel: { fontSize: typography.sizes.md, color: colors.textSecondary },
  lineValue: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },
  totalRow: {
    borderBottomWidth: 0,
    backgroundColor: '#F0FBF5',
  },
  totalLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
  totalValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },
  escrowCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: spacing.md,
  },
  escrowTextBlock: { flex: 1 },
  escrowTitle: { fontWeight: typography.weights.bold, color: colors.text, marginBottom: 4 },
  escrowBody: { fontSize: typography.sizes.sm, color: colors.textSecondary, lineHeight: 20 },
  refNote: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  cta: { marginTop: spacing.sm, marginBottom: 0 },
  // Processing
  processingContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  processingTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  processingBody: { fontSize: typography.sizes.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  timeoutText: { fontSize: typography.sizes.sm, color: '#92400E', textAlign: 'center', marginTop: spacing.md },
  // Receipt
  successBadge: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  successTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  receiptHeader: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  receiptKey: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  receiptValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
  heldBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  heldBadgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
