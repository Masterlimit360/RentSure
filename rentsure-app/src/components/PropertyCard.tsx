/**
 * Property Card Component.
 *
 * Used in lists to display a summary of a property.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import type { Property, BookingStatus } from '@/types';
import { formatCurrency } from '@/utils/format';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { usePreferences } from '@/hooks/usePreferences';
import { computeCompatibility } from '@/utils/compatibility';

interface PropertyCardProps {
  property: Property;
  index?: number;
  activeBookingStatus?: BookingStatus;
  activeBookingId?: string;
}

export function PropertyCard({ property, index = 0, activeBookingStatus, activeBookingId }: PropertyCardProps) {
  const router = useRouter();

  // Pick the first photo based on sort_order or use a placeholder
  const sortedMedia = [...(property.media || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const mainPhoto = sortedMedia.find((m) => m.mediaType === 'PHOTO')?.url;
  const imageUrl = mainPhoto || 'https://via.placeholder.com/400x300?text=No+Image';

  const { user } = useAuthStore();
  const { data: prefs } = usePreferences(user?.role === 'TENANT' ? user.id : undefined);
  const score = prefs ? computeCompatibility(prefs, property) : null;

  const getStatusDisplay = () => {
    if (activeBookingStatus) {
      switch(activeBookingStatus) {
        case 'REQUESTED': return { text: 'Request Pending', color: colors.warning, icon: 'time' as const };
        case 'ACCEPTED': return { text: 'Booking Accepted - Pay Now', color: colors.success, icon: 'checkmark-circle' as const };
        case 'PAID_ESCROW': return { text: 'Paid in Escrow', color: colors.primary, icon: 'lock-closed' as const };
        case 'MOVED_IN': return { text: 'Moved In', color: colors.success, icon: 'home' as const };
      }
    }
    if (property.status === 'RENTED') {
      return { text: 'Rented', color: colors.textSecondary, icon: 'lock-closed' as const };
    }
    return null;
  };

  const statusInfo = getStatusDisplay();

  const handlePress = () => {
    if (activeBookingId) {
      router.push(`/(tenant)/booking/${activeBookingId}` as any);
    } else {
      router.push(`/property/${property.id}` as any);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      layout={LinearTransition.springify()}
      style={styles.card}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          {statusInfo && (
            <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon} size={16} color={colors.surface} />
              <Text style={styles.statusBannerText}>{statusInfo.text}</Text>
            </View>
          )}
          {score && (
            <View style={[
              styles.scoreBadge, 
              { backgroundColor: score.total >= 75 ? colors.success : score.total >= 50 ? colors.warning : colors.textSecondary }
            ]}>
              {score.factors.some(f => f.score === 0 && f.key === 'AMENITIES' && f.detail.startsWith('Missing:')) && (
                <View style={styles.dealbreakerDot} />
              )}
              <Text style={styles.scoreBadgeText}>{score.total}% match</Text>
            </View>
          )}
        </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>
          {property.isVerified && (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.surface} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
        </View>

        <Text style={styles.location}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />{' '}
          {property.area}, {property.city}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.price}>
            {formatCurrency(property.pricePerYear)}
            <Text style={styles.priceUnit}> /yr</Text>
          </Text>

          <View style={styles.amenitiesRow}>
            <View style={styles.amenity}>
              <Ionicons name="bed-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.amenityText}>{property.bedrooms}</Text>
            </View>
            <View style={styles.amenity}>
              <Ionicons name="water-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.amenityText}>{property.bathrooms}</Text>
            </View>
          </View>
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: shadows.md,
      android: shadows.md,
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      } as any,
    }),
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
  statusBanner: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBannerText: {
    color: colors.surface,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  scoreBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dealbreakerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  scoreBadgeText: {
    color: colors.surface,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    gap: 4,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  location: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  priceUnit: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amenityText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
});
