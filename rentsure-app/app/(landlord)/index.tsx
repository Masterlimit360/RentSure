/**
 * Landlord My Listings Screen (Dashboard).
 *
 * Shows the landlord's property portfolio as a 2-column grid.
 * Properties retain their status badge (AVAILABLE / RENTED / HIDDEN) and
 * provide quick actions to hide or unhide them. The FAB opens the
 * multi-step listing wizard (listings/new.tsx).
 *
 * This screen is the primary landlord landing tab, not a sub-route.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { useProperties, useSoftDeleteProperty, useHardDeleteProperty } from '@/hooks/useProperties';
import { useMyBookings } from '@/hooks/useBookings';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Property, PropertyStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Status badge configuration
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<PropertyStatus, { label: string; color: string }> = {
  AVAILABLE: { label: 'Available', color: '#10B981' },
  RENTED:    { label: 'Rented',    color: '#3B82F6' },
  HIDDEN:    { label: 'Hidden',    color: '#9CA3AF' },
};

// ---------------------------------------------------------------------------
// Listing Card (for the grid)
// ---------------------------------------------------------------------------

interface ListingCardProps {
  property: Property;
  index: number;
  pendingRequestsCount?: number;
  onHide: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

function ListingCard({ property, index, pendingRequestsCount = 0, onHide, onEdit, onDelete }: ListingCardProps) {
  const badge = STATUS_BADGE[property.status];
  const photo = property.media.find((m) => m.mediaType === 'PHOTO')?.url;

  return (
    <Animated.View 
      style={styles.card}
      entering={FadeInUp.delay(index * 100).springify()}
      layout={LinearTransition.springify()}
    >
      <Image
        source={{ uri: photo ?? 'https://picsum.photos/seed/placeholder/400/300' }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {/* Status badge overlaid on image */}
      <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
        <Text style={styles.statusBadgeText}>{badge.label}</Text>
      </View>

      {/* Notification Badge for pending requests */}
      {pendingRequestsCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{pendingRequestsCount}</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
        <Text style={styles.cardPrice}>{formatCurrency(property.pricePerYear)}/yr</Text>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(property)}>
            <Ionicons name="pencil" size={14} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          {/* Hide/unhide — soft delete keeps the property in the DB */}
          {property.status !== 'RENTED' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onHide(property)}>
              <Ionicons
                name={property.status === 'HIDDEN' ? 'eye' : 'eye-off'}
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.actionBtnText}>
                {property.status === 'HIDDEN' ? 'Unhide' : 'Hide'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(property)}>
            <Ionicons name="trash" size={14} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function ListingSkeleton({ index }: { index: number }) {
  return (
    <Animated.View style={styles.card} entering={FadeInUp.delay(index * 100).springify()}>
      <Skeleton width="100%" height={110} />
      <View style={styles.cardBody}>
        <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
        <Skeleton width="50%" height={14} />
        <View style={styles.cardActions}>
          <Skeleton width={40} height={20} />
          <Skeleton width={40} height={20} />
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function LandlordListingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();

  // landlordId filter is not in our current PropertyFilters, so we filter client-side
  // from all properties. In production the API would accept a landlordId param.
  const { data, isLoading, isRefetching, refetch } = useProperties({});
  const { data: bookingsData } = useMyBookings(user?.id ?? '', 'LANDLORD');
  const softDeleteMutation = useSoftDeleteProperty();
  const hardDeleteMutation = useHardDeleteProperty();

  const myProperties = (data?.data?.content ?? []).filter(
    (p) => p.landlordId === user?.id
  );

  const pendingRequestsByProperty = React.useMemo(() => {
    const map: Record<string, number> = {};
    bookingsData?.data?.forEach(b => {
      if (b.status === 'REQUESTED') {
        map[b.propertyId] = (map[b.propertyId] || 0) + 1;
      }
    });
    return map;
  }, [bookingsData]);

  const handleHide = (property: Property) => {
    const action = property.status === 'HIDDEN' ? 'unhide' : 'hide';
    Alert.alert(
      `${action === 'hide' ? 'Hide' : 'Unhide'} Listing`,
      `${action === 'hide' ? 'Hiding removes this property from tenant search. You can unhide it anytime.' : 'This will make the property visible to tenants again.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'hide' ? 'Hide' : 'Unhide',
          onPress: () =>
            softDeleteMutation.mutate(
              { landlordId: user!.id, propertyId: property.id },
              { onSuccess: () => refetch() }
            ),
        },
      ]
    );
  };

  const handleEdit = (property: Property) => {
    router.push({ pathname: '/(landlord)/edit/[id]', params: { id: property.id } } as any);
  };

  const handleDelete = (property: Property) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to permanently delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            hardDeleteMutation.mutate(
              { landlordId: user!.id, propertyId: property.id },
              { onSuccess: () => refetch() }
            ),
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header with logout */}
      <Animated.View entering={FadeInDown.springify()} style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity onPress={() => logoutMutation.mutate()} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(100).springify()} style={styles.sectionTitle}>
        My Listings ({myProperties.length})
      </Animated.Text>

      {isLoading ? (
        <View style={styles.grid}>
          <View style={styles.columnWrapper}>
            <ListingSkeleton index={0} />
            <ListingSkeleton index={1} />
          </View>
          <View style={styles.columnWrapper}>
            <ListingSkeleton index={2} />
            <ListingSkeleton index={3} />
          </View>
        </View>
      ) : (
        <FlatList
          data={myProperties}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.grid}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No listings yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button below to add your first property</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ListingCard 
              property={item} 
              index={index}
              pendingRequestsCount={pendingRequestsByProperty[item.id]}
              onHide={handleHide} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          )}
        />
      )}

      {/* FAB to create a new listing */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/listings/new' as any)}
        >
          <Ionicons name="add" size={28} color={colors.surface} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  logoutBtn: {
    padding: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Listing Card
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardImage: {
    width: '100%',
    height: 110,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#fff',
    textTransform: 'uppercase',
  },
  notificationBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: '#DC2626',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  cardBody: {
    padding: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cardPrice: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: spacing.lg,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
