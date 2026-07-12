/**
 * Landlord Booking Requests Screen.
 *
 * The incoming requests queue for a landlord. Shows all bookings on the
 * landlord's properties, sorted newest-first. REQUESTED bookings show
 * Accept/Reject controls. All other statuses show a read-only status
 * stepper so the landlord can track where each booking sits in the lifecycle.
 *
 * Reject flow requires a reason from a preset list so we can build
 * analytics on rejection reasons — free-text alone is too noisy to aggregate.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useMyBookings, useAcceptBooking, useRejectBooking } from '@/hooks/useBookings';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Booking, BookingStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Preset rejection reasons — keeps rejection analytics actionable
// ---------------------------------------------------------------------------

const REJECT_REASONS = [
  'Property already rented',
  'Tenant profile incomplete',
  'Requested dates not suitable',
  'Preferred longer tenancy',
  'Other',
];

// ---------------------------------------------------------------------------
// Status stepper — visualises booking lifecycle position
// ---------------------------------------------------------------------------

const LIFECYCLE: { status: BookingStatus; label: string }[] = [
  { status: 'REQUESTED',   label: 'Requested' },
  { status: 'ACCEPTED',    label: 'Accepted' },
  { status: 'PAID_ESCROW', label: 'Payment Held' },
  { status: 'MOVED_IN',   label: 'Moved In' },
  { status: 'COMPLETED',  label: 'Completed' },
];

/** Maps a booking status to its position in the LIFECYCLE array, or -1 if terminal (REJECTED/EXPIRED). */
function getStepIndex(status: BookingStatus): number {
  return LIFECYCLE.findIndex((s) => s.status === status);
}

interface StatusStepperProps {
  status: BookingStatus;
}

function StatusStepper({ status }: StatusStepperProps) {
  const isTerminal = status === 'REJECTED' || status === 'EXPIRED';
  const currentIndex = getStepIndex(status);

  if (isTerminal) {
    return (
      <View style={styles.terminalRow}>
        <Ionicons name="close-circle" size={16} color="#DC2626" />
        <Text style={styles.terminalText}>
          {status === 'REJECTED' ? 'Booking Rejected' : 'Booking Expired'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stepper}>
      {LIFECYCLE.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <View key={step.status} style={styles.stepRow}>
            <View style={styles.stepIndicatorCol}>
              <View
                style={[
                  styles.stepDot,
                  done && styles.stepDotDone,
                  active && styles.stepDotActive,
                ]}
              >
                {done && <Ionicons name="checkmark" size={10} color={colors.surface} />}
              </View>
              {index < LIFECYCLE.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Reject Modal
// ---------------------------------------------------------------------------

interface RejectModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

function RejectModal({ visible, onClose, onConfirm, isLoading }: RejectModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selected) {
      Alert.alert('Select a reason', 'Please select a rejection reason.');
      return;
    }
    onConfirm(selected);
    setSelected(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Reject Booking</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSubtitle}>Select a reason</Text>
          {REJECT_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonRow, selected === r && styles.reasonSelected]}
              onPress={() => setSelected(r)}
            >
              <Ionicons
                name={selected === r ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selected === r ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.reasonText}>{r}</Text>
            </TouchableOpacity>
          ))}
          <Button
            title="Confirm Rejection"
            onPress={handleConfirm}
            isLoading={isLoading}
            style={[styles.confirmRejectBtn, { backgroundColor: '#DC2626' }]}
          />
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Booking Request Card
// ---------------------------------------------------------------------------

interface RequestCardProps {
  booking: Booking;
  onAccept: (booking: Booking) => void;
  onReject: (booking: Booking) => void;
}

function RequestCard({ booking, onAccept, onReject }: RequestCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.bookingRef}>{booking.bookingRef}</Text>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {booking.propertyTitle || 'Property'}
          </Text>
          <Text style={styles.cardMeta}>
            {new Date(booking.requestedAt).toLocaleDateString()} · {booking.durationMonths} months
          </Text>
          <Text style={styles.cardAmount}>{formatCurrency(booking.totalAmount)}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedBody}>
          <View style={styles.tenantDetails}>
            <Text style={styles.sectionTitle}>Tenant Details</Text>
            <View style={styles.tenantRow}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.tenantText}>{booking.tenantName || 'Unknown Tenant'}</Text>
            </View>
            <View style={styles.tenantRow}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.tenantText}>{booking.tenantPhone || 'No phone'}</Text>
            </View>
          </View>
          
          <StatusStepper status={booking.status} />

          {booking.status === 'REQUESTED' && (
            <View style={styles.actionRow}>
              <Button
                title="Reject"
                onPress={() => onReject(booking)}
                style={[styles.halfBtn, { backgroundColor: '#DC2626' }]}
              />
              <Button
                title="Accept"
                onPress={() => onAccept(booking)}
                style={styles.halfBtn}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function RequestSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="70%" height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={120} height={14} style={{ marginBottom: 4 }} />
          <Skeleton width={80} height={18} />
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function LandlordRequestsScreen() {
  const { user } = useAuthStore();
  const { data, isLoading, refetch } = useMyBookings(user?.id ?? '', 'LANDLORD');
  const acceptMutation = useAcceptBooking();
  const rejectMutation = useRejectBooking();

  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');

  // Filter and sort bookings
  const bookings = [...(data?.data ?? [])]
    .filter(b => {
      // Status filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      // Search filter
      if (searchQuery) {
        const qLower = searchQuery.toLowerCase();
        const refMatch = b.bookingRef?.toLowerCase().includes(qLower);
        const tenantMatch = b.tenantName?.toLowerCase().includes(qLower);
        const propertyMatch = b.propertyTitle?.toLowerCase().includes(qLower);
        if (!refMatch && !tenantMatch && !propertyMatch) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const handleAccept = (booking: Booking) => {
    Alert.alert(
      'Accept Booking',
      `Accept booking ${booking.bookingRef}? The tenant will have 72 hours to pay.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () =>
            acceptMutation.mutate(booking.id, {
              onSuccess: (res) => {
                if (!res.success) Alert.alert('Error', res.error?.message ?? 'Try again');
              },
            }),
        },
      ]
    );
  };

  const handleRejectConfirm = (reason: string) => {
    if (!rejectTarget) return;
    rejectMutation.mutate(rejectTarget.id, {
      onSuccess: (res) => {
        if (res.success) {
          setRejectTarget(null);
        } else {
          Alert.alert('Error', res.error?.message ?? 'Try again');
        }
      },
    });
  };

  return (
    <Screen noPadding style={{ backgroundColor: colors.background }}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Booking Requests</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search ref, tenant, property..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.filterRow}>
          {['ALL', 'REQUESTED', 'ACCEPTED', 'PAID_ESCROW', 'MOVED_IN', 'COMPLETED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status as any)}
            >
              <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                {status === 'ALL' ? 'All' : status === 'PAID_ESCROW' ? 'Payment Held' : status === 'MOVED_IN' ? 'Moved In' : status.charAt(0) + status.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <RequestSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No booking requests yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <RequestCard
              booking={item}
              onAccept={handleAccept}
              onReject={setRejectTarget}
            />
          )}
        />
      )}

      <RejectModal
        visible={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        isLoading={rejectMutation.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heading: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchRow: {
    marginBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 80,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardHeaderContent: {
    flex: 1,
  },
  bookingRef: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  propertyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  expandedBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  tenantDetails: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  tenantText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  // Stepper
  stepper: {
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 16,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  stepLineDone: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    paddingTop: 1,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  terminalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  terminalText: {
    fontSize: typography.sizes.sm,
    color: '#DC2626',
    fontWeight: typography.weights.medium,
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  halfBtn: {
    flex: 1,
    marginVertical: 0,
  },
  // Reject Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  reasonSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reasonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  confirmRejectBtn: {
    marginTop: spacing.md,
    marginBottom: 0,
  },
});
