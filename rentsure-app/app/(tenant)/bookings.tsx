/**
 * Tenant Bookings Screen.
 *
 * The single screen driving the booking lifecycle from the tenant's perspective.
 * The booking status dictates every piece of UI — a tenant may only perform the
 * one legal next action for their current state. All action buttons call the same
 * state-machine transitions that the mock (and real) backend enforces.
 *
 * Status → Action mapping:
 *   REQUESTED   → "Awaiting landlord" (read-only)
 *   ACCEPTED    → "Pay Now"          → payment stub → PAID_ESCROW
 *   PAID_ESCROW → "Confirm Move-in"  → confirmation dialog → MOVED_IN
 *   MOVED_IN    → "Leave a Review"   → review modal → COMPLETED
 *   REJECTED / EXPIRED / COMPLETED   → read-only pill
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useMyBookings, usePayBooking, useConfirmMoveIn } from '@/hooks/useBookings';
import { useCreateReview } from '@/hooks/useReviews';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Booking, BookingStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Status pill configuration
// Single source of truth for status label + color. Changing a status label
// here automatically updates every BookingCard — don't hard-code these elsewhere.
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  REQUESTED:   { label: 'Pending',     bg: '#FEF3C7', fg: '#92400E' },
  ACCEPTED:    { label: 'Accepted',    bg: '#D1FAE5', fg: '#065F46' },
  PAID_ESCROW: { label: 'Paid',        bg: '#DBEAFE', fg: '#1E40AF' },
  MOVED_IN:    { label: 'Moved In',    bg: '#EDE9FE', fg: '#5B21B6' },
  COMPLETED:   { label: 'Completed',   bg: '#D1FAE5', fg: '#065F46' },
  REJECTED:    { label: 'Rejected',    bg: '#FEE2E2', fg: '#991B1B' },
  EXPIRED:     { label: 'Expired',     bg: '#F3F4F6', fg: '#6B7280' },
  CANCELLED:   { label: 'Cancelled',   bg: '#FEE2E2', fg: '#991B1B' },
};

/** Active bookings require tenant attention; past are terminal states. */
const ACTIVE_STATUSES: BookingStatus[] = ['REQUESTED', 'ACCEPTED', 'PAID_ESCROW', 'MOVED_IN'];

// ---------------------------------------------------------------------------
// Booking Card
// ---------------------------------------------------------------------------

interface BookingCardProps {
  booking: Booking;
  index: number;
  onPayNow: (booking: Booking) => void;
  onConfirmMoveIn: (booking: Booking) => void;
  onLeaveReview: (booking: Booking) => void;
}

function BookingCard({ booking, index, onPayNow, onConfirmMoveIn, onLeaveReview }: BookingCardProps) {
  const cfg = STATUS_CONFIG[booking.status];

  return (
    <Animated.View 
      style={styles.card}
      entering={FadeInUp.delay(index * 100).springify()}
      layout={LinearTransition.springify()}
    >
      <View style={styles.cardTitleRow}>
        <Text style={styles.bookingRef}>{booking.bookingRef}</Text>
        <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.pillText, { color: cfg.fg }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.propertyRow}>
        {booking.propertyImage ? (
          <Image source={{ uri: booking.propertyImage }} style={styles.propertyImage} />
        ) : (
          <View style={[styles.propertyImage, styles.propertyImagePlaceholder]}>
            <Ionicons name="home" size={24} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {booking.propertyTitle || 'Property'}
          </Text>
          <Text style={styles.cardMeta}>
            Move-in: {new Date(booking.moveInDate).toLocaleDateString()} · {booking.durationMonths} mo
          </Text>
          <Text style={styles.cardAmount}>{formatCurrency(booking.totalAmount)}</Text>
        </View>
      </View>

      {/* One legal action per state — nothing else is shown */}
      {booking.status === 'REQUESTED' && (
        <View style={styles.waitingRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.waitingText}>Waiting for landlord</Text>
        </View>
      )}
      {booking.status === 'ACCEPTED' && (
        <Button title="Pay Now" onPress={() => onPayNow(booking)} style={styles.actionBtn} />
      )}
      {booking.status === 'PAID_ESCROW' && (
        <Button title="Confirm Move-in" onPress={() => onConfirmMoveIn(booking)} style={styles.actionBtn} />
      )}
      {booking.status === 'MOVED_IN' && (
        <Button
          title="Leave a Review"
          onPress={() => onLeaveReview(booking)}
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
        />
      )}
    </Animated.View>
  );
}

function BookingSkeleton({ index }: { index: number }) {
  return (
    <Animated.View 
      style={styles.card}
      entering={FadeInUp.delay(index * 100).springify()}
    >
      <View style={styles.cardTitleRow}>
        <Skeleton width={120} height={20} />
        <Skeleton width={80} height={24} radius={12} />
      </View>
      <View style={styles.propertyRow}>
        <Skeleton width={80} height={80} radius={borderRadius.md} />
        <View style={styles.propertyInfo}>
          <Skeleton width={150} height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
          <Skeleton width={80} height={20} />
        </View>
      </View>
      <Skeleton width="100%" height={48} radius={borderRadius.md} style={{ marginTop: spacing.sm }} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Review Modal
// ---------------------------------------------------------------------------

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  isLoading: boolean;
}

function ReviewModal({ visible, onClose, onSubmit, isLoading }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('Comment required', 'Please describe your experience.');
      return;
    }
    onSubmit(rating, comment);
    // Reset local state for next use
    setRating(5);
    setComment('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Leave a Review</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Your Rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)}>
                  <Ionicons
                    name={n <= rating ? 'star' : 'star-outline'}
                    size={34}
                    color={n <= rating ? colors.accent : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Comment</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your experience with the landlord and property…"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />

            <Button
              title="Submit Review"
              onPress={handleSubmit}
              isLoading={isLoading}
              style={styles.submitBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TenantBookingsScreen() {
  const { user } = useAuthStore();
  const { data, isLoading, isRefetching, refetch } = useMyBookings(user?.id ?? '', 'TENANT');
  const payMutation = usePayBooking();
  const moveInMutation = useConfirmMoveIn();
  const reviewMutation = useCreateReview();

  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  const allBookings: Booking[] = data?.data ?? [];
  const active = allBookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const past = allBookings.filter((b) => !ACTIVE_STATUSES.includes(b.status));
  const displayed = activeTab === 'active' ? active : past;

  const handlePayNow = (booking: Booking) => {
    Alert.alert(
      'Confirm Payment',
      `Pay ${formatCurrency(booking.totalAmount)} into escrow? The landlord receives funds only after you confirm move-in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Pay',
          onPress: () =>
            payMutation.mutate(booking.id, {
              onSuccess: (res) => {
                if (!res.success) Alert.alert('Payment Failed', res.error?.message ?? 'Try again');
              },
            }),
        },
      ]
    );
  };

  const handleConfirmMoveIn = (booking: Booking) => {
    // Extra confirmation because this releases escrow — it cannot be undone.
    Alert.alert(
      'Confirm Move-in',
      'This will release escrow funds to the landlord. Only confirm once you have physically moved in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I have moved in',
          onPress: () =>
            moveInMutation.mutate(booking.id, {
              onSuccess: (res) => {
                if (!res.success) Alert.alert('Error', res.error?.message ?? 'Try again');
              },
            }),
        },
      ]
    );
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    if (!reviewTarget) return;
    reviewMutation.mutate(
      {
        reviewerId: user!.id,
        req: {
          bookingId: reviewTarget.id,
          // revieweeId is the property's landlord; real implementation would
          // look this up via the property record
          revieweeId: 'u-landlord-001',
          rating: rating as 1 | 2 | 3 | 4 | 5,
          comment,
        },
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setReviewTarget(null);
          } else {
            Alert.alert('Error', res.error?.message ?? 'Could not submit review');
          }
        },
      }
    );
  };

  return (
    <Screen noPadding>
      <View style={styles.topBar}>
        <Text style={styles.heading}>My Bookings</Text>
        <View style={styles.tabs}>
          {(['active', 'past'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'active' ? `Active (${active.length})` : `Past (${past.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((_, i) => <BookingSkeleton key={i} index={i} />)}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {activeTab === 'active' ? 'No active bookings' : 'No past bookings'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <BookingCard
              booking={item}
              index={index}
              onPayNow={handlePayNow}
              onConfirmMoveIn={handleConfirmMoveIn}
              onLeaveReview={setReviewTarget}
            />
          )}
        />
      )}

      <ReviewModal
        visible={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={handleReviewSubmit}
        isLoading={reviewMutation.isPending}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heading: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm,
  },
  tabLabelActive: {
    color: colors.surface,
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
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }
    }),
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bookingRef: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  pillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  propertyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  propertyImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  propertyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
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
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  waitingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionBtn: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  // Review Modal
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
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    minHeight: 100,
  },
  submitBtn: {
    marginTop: spacing.lg,
    marginBottom: 0,
  },
});
