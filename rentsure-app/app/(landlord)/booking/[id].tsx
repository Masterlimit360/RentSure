/**
 * Landlord Booking Detail Screen.
 *
 * The landlord's single source of truth for one booking. Same structure as
 * the tenant detail screen but shows the Accept/Reject action for REQUESTED
 * bookings and displays the escrow release timestamp when funds are disbursed.
 *
 * Navigated to from requests.tsx when a landlord taps a booking for full context.
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
import { useMyBookings, useAcceptBooking, useRejectBooking } from '@/hooks/useBookings';
import { usePaymentStatus } from '@/hooks/usePayments';
import { useAgreement, useSignAgreement } from '@/hooks/useAgreements';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Booking, BookingStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Timeline (same steps as tenant detail)
// ---------------------------------------------------------------------------

const LIFECYCLE: { status: BookingStatus; label: string }[] = [
  { status: 'REQUESTED',   label: 'Requested' },
  { status: 'ACCEPTED',    label: 'Accepted' },
  { status: 'PAID_ESCROW', label: 'Payment Held' },
  { status: 'MOVED_IN',    label: 'Moved In' },
  { status: 'COMPLETED',   label: 'Completed' },
];

function getStepIndex(status: BookingStatus): number {
  return LIFECYCLE.findIndex((s) => s.status === status);
}

function TimelineSection({ booking }: { booking: Booking }) {
  const isTerminal = booking.status === 'REJECTED' || booking.status === 'EXPIRED';
  const currentIndex = getStepIndex(booking.status);

  if (isTerminal) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.terminalBox}>
          <Ionicons name="close-circle" size={20} color={colors.error} />
          <Text style={styles.terminalText}>Booking {booking.status === 'REJECTED' ? 'Rejected' : 'Expired'}</Text>
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
                {done && <Ionicons name="checkmark" size={10} color="#fff" />}
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
// Payment section (landlord perspective shows escrow RELEASED)
// ---------------------------------------------------------------------------

function PaymentSection({ bookingId }: { bookingId: string }) {
  const { data } = usePaymentStatus(bookingId);
  const payment = data?.data;

  if (!payment) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text style={styles.emptyNote}>No payment received yet.</Text>
      </View>
    );
  }

  const isReleased = payment.escrowStatus === 'RELEASED';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment & Escrow</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Amount</Text>
          <Text style={styles.infoValue}>{formatCurrency(payment.amount)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Escrow</Text>
          <View style={[styles.statusChip, { backgroundColor: isReleased ? '#D1FAE5' : '#DBEAFE' }]}>
            <Text style={[styles.statusChipText, { color: isReleased ? '#065F46' : '#1E40AF' }]}>
              {payment.escrowStatus}
            </Text>
          </View>
        </View>
        {payment.releasedAt && (
          <View style={styles.infoRow}>
            {/* releasedAt marks when funds were disbursed to the landlord's account */}
            <Text style={styles.infoKey}>Released To You</Text>
            <Text style={styles.infoValue}>{new Date(payment.releasedAt).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Agreement section (landlord perspective)
// ---------------------------------------------------------------------------

function AgreementSection({ bookingId }: { bookingId: string }) {
  const { data, refetch } = useAgreement(bookingId);
  const signMutation = useSignAgreement();
  const [acknowledged, setAcknowledged] = useState(false);
  const agreement = data?.data;

  if (!agreement) return null;

  const mySignedAt = agreement.landlordSignedAt;

  const handleSign = () => {
    if (!acknowledged) {
      Alert.alert('Acknowledgment required', 'Please tick the box to confirm you have read the agreement.');
      return;
    }
    Alert.alert(
      'Sign Agreement',
      'Your signature confirms the rental terms and authorises the tenant to move in once they confirm. This is legally binding.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign',
          onPress: () =>
            signMutation.mutate(
              { bookingId, req: { role: 'LANDLORD' } },
              { onSuccess: () => refetch() }
            ),
        },
      ]
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rental Agreement</Text>
      <View style={styles.infoCard}>
        <TouchableOpacity style={styles.pdfRow} onPress={() => Linking.openURL(agreement.pdfUrl)}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={styles.pdfLink}>View Agreement PDF</Text>
          <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.sigRow}>
          <Ionicons name={agreement.tenantSignedAt ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={agreement.tenantSignedAt ? colors.success : colors.textSecondary} />
          <Text style={styles.sigLabel}>Tenant</Text>
          <Text style={styles.sigDate}>{agreement.tenantSignedAt ? new Date(agreement.tenantSignedAt).toLocaleDateString() : 'Pending'}</Text>
        </View>
        <View style={styles.sigRow}>
          <Ionicons name={agreement.landlordSignedAt ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={agreement.landlordSignedAt ? colors.success : colors.textSecondary} />
          <Text style={styles.sigLabel}>Landlord (You)</Text>
          <Text style={styles.sigDate}>{agreement.landlordSignedAt ? new Date(agreement.landlordSignedAt).toLocaleDateString() : 'Pending'}</Text>
        </View>
      </View>

      {!mySignedAt && (
        <View style={styles.signBlock}>
          <TouchableOpacity style={styles.checkRow} onPress={() => setAcknowledged(!acknowledged)}>
            <Ionicons name={acknowledged ? 'checkbox' : 'square-outline'} size={22} color={acknowledged ? colors.primary : colors.textSecondary} />
            <Text style={styles.checkLabel}>
              I confirm I have read the rental agreement and consent to the tenant occupying the property under these terms.
            </Text>
          </TouchableOpacity>
          <Button title="Sign Agreement" onPress={handleSign} isLoading={signMutation.isPending} style={styles.signBtn} />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tenant Profile section
// ---------------------------------------------------------------------------

function TenantSection({ booking }: { booking: Booking }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tenant Profile</Text>
      <View style={styles.tenantCard}>
        <View style={styles.tenantRow}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantLabel}>Name</Text>
            <Text style={styles.tenantValue}>{booking.tenantName || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.tenantRow}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantLabel}>Phone</Text>
            <Text style={styles.tenantValue}>{booking.tenantPhone || 'Not provided'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function LandlordBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: bookingsData, isLoading } = useMyBookings(user?.id ?? '', 'LANDLORD');
  const acceptMutation = useAcceptBooking();
  const rejectMutation = useRejectBooking();

  const booking = bookingsData?.data?.find((b) => b.id === id);
  const isPaidOrLater = booking && ['PAID_ESCROW', 'MOVED_IN', 'COMPLETED'].includes(booking.status);

  const handleAccept = () =>
    Alert.alert('Accept Booking', `Accept ${booking?.bookingRef}? The tenant will have 72 hours to pay.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => acceptMutation.mutate(id!) },
    ]);

  const handleReject = () =>
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate(id!) },
    ]);

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
  if (!booking) return <Screen><Text style={styles.notFound}>Booking not found.</Text></Screen>;

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
          <Text style={styles.heroRef}>{booking.bookingRef}</Text>
          <Text style={styles.heroMeta}>
            Move-in: {new Date(booking.moveInDate).toLocaleDateString()} · {booking.durationMonths} months
          </Text>
          <Text style={styles.heroAmount}>{formatCurrency(booking.totalAmount)}/year</Text>
        </View>

        <TimelineSection booking={booking} />
        <TenantSection booking={booking} />

        {isPaidOrLater && <PaymentSection bookingId={booking.id} />}
        {isPaidOrLater && <AgreementSection bookingId={booking.id} />}

        {booking.status === 'REQUESTED' && (
          <View style={styles.actionRow}>
            <Button title="Reject" onPress={handleReject} isLoading={rejectMutation.isPending} style={[styles.halfBtn, { backgroundColor: colors.error }]} />
            <Button title="Accept" onPress={handleAccept} isLoading={acceptMutation.isPending} style={styles.halfBtn} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: spacing.xs },
  topBarTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  scrollContent: { padding: spacing.lg, paddingBottom: 80 },
  hero: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ... },
  heroRef: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  heroMeta: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 4 },
  heroAmount: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.primary, marginTop: spacing.xs },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.sm },
  emptyNote: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  notFound: { textAlign: 'center', color: colors.textSecondary, marginBottom: spacing.md },
  terminalBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  terminalText: { color: colors.error, fontWeight: typography.weights.medium },
  stepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepLeft: { alignItems: 'center', width: 16 },
  stepDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  stepLine: { width: 2, height: 24, backgroundColor: colors.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: colors.primary },
  stepLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary, paddingTop: 1 },
  stepLabelActive: { color: colors.primary, fontWeight: typography.weights.bold },
  stepLabelDone: { color: colors.text },
  infoCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', ... },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoKey: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  infoValue: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  statusChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.pill },
  statusChipText: { fontSize: 11, fontWeight: typography.weights.bold, textTransform: 'uppercase' },
  pdfRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  pdfLink: { flex: 1, color: colors.primary, fontWeight: typography.weights.medium },
  divider: { height: 1, backgroundColor: colors.border },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  sigLabel: { flex: 1, fontSize: typography.sizes.sm, color: colors.text },
  sigDate: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  signBlock: { marginTop: spacing.md },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md, padding: spacing.md, backgroundColor: '#FFFBEB', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#FDE68A' },
  checkLabel: { flex: 1, fontSize: typography.sizes.sm, color: colors.text, lineHeight: 20 },
  signBtn: { marginBottom: 0 },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  halfBtn: { flex: 1, marginVertical: 0 },
  tenantCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingVertical: spacing.sm, ... },
  tenantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tenantInfo: { flex: 1 },
  tenantLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  tenantValue: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },
});
