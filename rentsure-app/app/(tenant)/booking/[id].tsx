/**
 * Tenant Booking Detail Screen.
 *
 * The single source of truth for one booking from the tenant's perspective.
 * Shows the full lifecycle timeline, payment receipt (if paid), digital
 * agreement status + signing, and the contextual next action button.
 *
 * Navigated to from bookings.tsx when a tenant taps a booking card for full context.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useMyBookings, useConfirmMoveIn, useCancelBooking } from '@/hooks/useBookings';
import { usePaymentStatus } from '@/hooks/usePayments';
import { useAgreement, useSignAgreement } from '@/hooks/useAgreements';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Booking, BookingStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Status timeline data (shared with landlord detail screen)
// ---------------------------------------------------------------------------

const LIFECYCLE: { status: BookingStatus; label: string; icon: string }[] = [
  { status: 'REQUESTED',   label: 'Requested',       icon: 'time-outline' },
  { status: 'ACCEPTED',    label: 'Accepted',         icon: 'checkmark-circle-outline' },
  { status: 'PAID_ESCROW', label: 'Payment Held',     icon: 'lock-closed-outline' },
  { status: 'MOVED_IN',    label: 'Moved In',         icon: 'home-outline' },
  { status: 'COMPLETED',   label: 'Completed',        icon: 'ribbon-outline' },
];

function getStepIndex(status: BookingStatus): number {
  return LIFECYCLE.findIndex((s) => s.status === status);
}

// ---------------------------------------------------------------------------
// Section: Status Timeline
// ---------------------------------------------------------------------------

function TimelineSection({ booking }: { booking: Booking }) {
  const isTerminal = booking.status === 'REJECTED' || booking.status === 'EXPIRED';
  const currentIndex = getStepIndex(booking.status);

  if (isTerminal) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.terminalBox}>
          <Ionicons name="close-circle" size={20} color={colors.error} />
          <Text style={styles.terminalText}>
            Booking {booking.status === 'REJECTED' ? 'Rejected' : 'Expired'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Status Timeline</Text>
      {LIFECYCLE.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <View key={step.status} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color="#fff" />
                  : <Ionicons name={step.icon as any} size={10} color={active ? colors.primary : colors.border} />
                }
              </View>
              {index < LIFECYCLE.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section: Payment Receipt
// ---------------------------------------------------------------------------

function PaymentSection({ bookingId }: { bookingId: string }) {
  const { data } = usePaymentStatus(bookingId);
  const payment = data?.data;

  if (!payment) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text style={styles.emptyNote}>No payment on record yet.</Text>
      </View>
    );
  }

  const escrowColor = payment.escrowStatus === 'HELD' ? '#065F46' : payment.escrowStatus === 'RELEASED' ? colors.primary : colors.error;
  const escrowBg = payment.escrowStatus === 'HELD' ? '#D1FAE5' : payment.escrowStatus === 'RELEASED' ? '#EFF6FF' : '#FEE2E2';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Amount</Text>
          <Text style={styles.infoValue}>{formatCurrency(payment.amount)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Paid On</Text>
          <Text style={styles.infoValue}>{new Date(payment.paidAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Escrow</Text>
          <View style={[styles.statusChip, { backgroundColor: escrowBg }]}>
            <Text style={[styles.statusChipText, { color: escrowColor }]}>{payment.escrowStatus}</Text>
          </View>
        </View>
        {payment.releasedAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Released</Text>
            <Text style={styles.infoValue}>{new Date(payment.releasedAt).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section: Digital Agreement
// ---------------------------------------------------------------------------

interface AgreementSectionProps {
  bookingId: string;
  signerRole: 'TENANT' | 'LANDLORD';
}

function AgreementSection({ bookingId, signerRole }: AgreementSectionProps) {
  const router = useRouter();
  const { data, refetch } = useAgreement(bookingId);
  const signMutation = useSignAgreement();
  const [acknowledged, setAcknowledged] = useState(false);
  const agreement = data?.data;

  if (!agreement) return null; // Agreement section hidden until payment received

  const hasSignedAsTenant = !!agreement.tenantSignedAt;
  const hasSignedAsLandlord = !!agreement.landlordSignedAt;
  const mySignedAt = signerRole === 'TENANT' ? agreement.tenantSignedAt : agreement.landlordSignedAt;

  const handleSign = () => {
    if (!acknowledged) {
      Alert.alert('Acknowledgment required', 'Please read and check the acknowledgment box.');
      return;
    }
    Alert.alert(
      'Confirm Signature',
      'By signing you confirm you have read and agreed to the rental terms. This is legally binding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Agreement',
          onPress: () =>
            signMutation.mutate(
              { bookingId, req: { role: signerRole } },
              {
                onSuccess: (res) => {
                  if (!res.success) Alert.alert('Error', res.error?.message ?? 'Could not sign');
                  else refetch();
                },
              }
            ),
        },
      ]
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rental Agreement</Text>
      <View style={styles.infoCard}>
        <TouchableOpacity 
          style={styles.pdfRow} 
          onPress={() => router.push(`/agreement/${agreement.id}`)}
        >
          <Ionicons name="document-text" size={24} color={colors.primary} />
          <Text style={styles.pdfLink}>View Rent Agreement</Text>
          <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Signature status for both parties */}
        <View style={styles.sigRow}>
          <Ionicons
            name={hasSignedAsTenant ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={hasSignedAsTenant ? colors.success : colors.textSecondary}
          />
          <Text style={styles.sigLabel}>Tenant</Text>
          <Text style={styles.sigDate}>
            {agreement.tenantSignedAt
              ? new Date(agreement.tenantSignedAt).toLocaleDateString()
              : 'Pending'}
          </Text>
        </View>
        <View style={styles.sigRow}>
          <Ionicons
            name={hasSignedAsLandlord ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={hasSignedAsLandlord ? colors.success : colors.textSecondary}
          />
          <Text style={styles.sigLabel}>Landlord</Text>
          <Text style={styles.sigDate}>
            {agreement.landlordSignedAt
              ? new Date(agreement.landlordSignedAt).toLocaleDateString()
              : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Sign CTA — only shown if this role hasn't signed yet */}
      {!mySignedAt && (
        <View style={styles.signBlock}>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAcknowledged(!acknowledged)}
          >
            <Ionicons
              name={acknowledged ? 'checkbox' : 'square-outline'}
              size={22}
              color={acknowledged ? colors.primary : colors.textSecondary}
            />
            <Text style={styles.checkLabel}>
              I have read the rental agreement and agree to its terms. I understand this signature is legally binding.
            </Text>
          </TouchableOpacity>
          <Button
            title="Sign Agreement"
            onPress={handleSign}
            isLoading={signMutation.isPending}
            style={styles.signBtn}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TenantBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: bookingsData, isLoading } = useMyBookings(user?.id ?? '', 'TENANT');
  const moveInMutation = useConfirmMoveIn();
  const cancelMutation = useCancelBooking();

  const booking = bookingsData?.data?.find((b) => b.id === id);

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () =>
            cancelMutation.mutate(id!, {
              onSuccess: (res) => {
                if (!res.success) Alert.alert('Error', res.error?.message ?? 'Could not cancel booking');
              },
            }),
        },
      ]
    );
  };

  const handleConfirmMoveIn = () => {
    // Extra dialog because this releases escrow — irreversible action.
    Alert.alert(
      'Confirm Move-in',
      'This will release escrow funds to the landlord and cannot be undone. Only confirm once you have physically moved in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I have moved in',
          onPress: () =>
            moveInMutation.mutate(id!, {
              onSuccess: (res) => {
                if (!res.success) Alert.alert('Error', res.error?.message ?? 'Try again');
              },
            }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <Screen noPadding>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Booking Detail</Text>
          <View style={{ width: 34 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <Skeleton width={120} height={24} style={{ marginBottom: 4 }} />
            <Skeleton width={200} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width={150} height={28} />
          </View>
          <View style={styles.section}>
            <Skeleton width={120} height={20} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="100%" height={200} radius={borderRadius.lg} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  if (!booking) {
    return (
      <Screen>
        <Text style={styles.notFound}>Booking not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const isPaidOrLater = ['PAID_ESCROW', 'MOVED_IN', 'COMPLETED'].includes(booking.status);

  return (
    <Screen noPadding>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Booking Detail</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Identity */}
        <View style={styles.hero}>
          <Text style={styles.heroRef}>{booking.bookingRef}</Text>
          <Text style={styles.heroMeta}>
            Move-in: {new Date(booking.moveInDate).toLocaleDateString()} · {booking.durationMonths} months
          </Text>
          <Text style={styles.heroAmount}>{formatCurrency(booking.totalAmount)}/year</Text>
        </View>

        <TimelineSection booking={booking} />

        {isPaidOrLater && <PaymentSection bookingId={booking.id} />}

        {isPaidOrLater && <AgreementSection bookingId={booking.id} signerRole="TENANT" />}

        {/* Contextual action */}
        {booking.status === 'ACCEPTED' && (
          <Button
            title="Pay Now"
            onPress={() => router.push({ pathname: '/(tenant)/payment/[bookingId]', params: { bookingId: booking.id } } as any)}
            style={styles.actionBtn}
          />
        )}
        {(booking.status === 'REQUESTED' || booking.status === 'ACCEPTED') && (
          <Button
            title="Cancel Booking"
            variant="outline"
            onPress={handleCancelBooking}
            isLoading={cancelMutation.isPending}
            style={[styles.cancelBtn, { borderColor: colors.error }]}
          />
        )}
        {booking.status === 'PAID_ESCROW' && (
          <Button
            title="Confirm Move-in"
            onPress={handleConfirmMoveIn}
            isLoading={moveInMutation.isPending}
            style={styles.actionBtn}
          />
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
  topBarTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  scrollContent: { padding: spacing.lg, paddingBottom: 80 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: shadows.sm,
      android: shadows.sm,
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    }),
  },
  heroRef: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  heroMeta: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 4 },
  heroAmount: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.primary, marginTop: spacing.xs },
  // Section
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.sm },
  emptyNote: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  notFound: { textAlign: 'center', color: colors.textSecondary, marginBottom: spacing.md },
  // Timeline
  terminalBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  terminalText: { color: colors.error, fontWeight: typography.weights.medium },
  stepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepLeft: { alignItems: 'center', width: 16 },
  stepDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  stepLine: { width: 2, height: 24, backgroundColor: colors.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: colors.primary },
  stepLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary, paddingTop: 1 },
  stepLabelActive: { color: colors.primary, fontWeight: typography.weights.bold },
  stepLabelDone: { color: colors.text },
  // Info card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: shadows.sm,
      android: shadows.sm,
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoKey: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  infoValue: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  statusChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  statusChipText: { fontSize: 11, fontWeight: typography.weights.bold, textTransform: 'uppercase' },
  // Agreement
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pdfLink: { flex: 1, color: colors.primary, fontWeight: typography.weights.medium },
  divider: { height: 1, backgroundColor: colors.border },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sigLabel: { flex: 1, fontSize: typography.sizes.sm, color: colors.text },
  sigDate: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  signBlock: { marginTop: spacing.md },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FFFBEB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  checkLabel: { flex: 1, fontSize: typography.sizes.sm, color: colors.text, lineHeight: 20 },
  signBtn: { marginBottom: 0 },
  actionBtn: { marginTop: spacing.sm, marginBottom: 0 },
});
