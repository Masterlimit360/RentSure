/**
 * Property Detail Screen.
 *
 * Displays full property details, landlord information, and reviews.
 * Includes a sticky bottom bar to initiate the booking request flow.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperty } from '@/hooks/useProperties';
import { usePropertyReviews } from '@/hooks/useReviews';
import { useCreateBooking, useMyBookings } from '@/hooks/useBookings';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { Review } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const { data: propertyData, isLoading: isPropertyLoading } = useProperty(id || '');
  const { data: reviewsData } = usePropertyReviews(id || '');
  const createBookingMutation = useCreateBooking();
  const { data: bookingsData } = useMyBookings(user?.id ?? '', 'TENANT');

  const activeBooking = bookingsData?.data?.find(b => 
    b.propertyId === id && 
    ['REQUESTED', 'ACCEPTED', 'PAID_ESCROW', 'MOVED_IN'].includes(b.status)
  );

  const [activeImage, setActiveImage] = useState(0);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  
  // Booking Form State
  // Real app: use a native date picker. For mock: simple text input.
  const [moveInDate, setMoveInDate] = useState('2025-01-01');
  const [durationMonths, setDurationMonths] = useState('12');

  if (isPropertyLoading) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>Loading property details...</Text>
        </View>
      </Screen>
    );
  }

  const property = propertyData?.data;
  if (!property) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>Property not found.</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const reviews = reviewsData?.data || [];
  const photos = property.media.filter((m) => m.mediaType === 'PHOTO');

  const handleBookingSubmit = () => {
    if (!user) {
      showToast('You must be logged in to book', 'error');
      return;
    }

    const duration = parseInt(durationMonths, 10);
    if (isNaN(duration) || duration < 1) {
      showToast('Please enter a valid duration', 'error');
      return;
    }

    // Tenant is logged in, use their ID
    createBookingMutation.mutate(
      {
        tenantId: user.id,
        req: {
          propertyId: property.id,
          moveInDate,
          durationMonths: duration,
        },
      },
      {
        onSuccess: (res) => {
          if (res.success && res.data) {
            setBookingModalVisible(false);
            showToast(`Booking requested! Ref: ${res.data.bookingRef}`);
            router.push('/(tenant)/bookings');
          } else {
            showToast(res.error?.message || 'Failed to request booking', 'error');
          }
        },
        onError: () => {
          showToast('Network error while requesting booking', 'error');
        },
      }
    );
  };

  const computedTotal = property.pricePerYear * (parseInt(durationMonths, 10) || 0) / 12;

  return (
    <Screen noPadding>
      <Stack.Screen options={{ title: 'Details', headerTransparent: true, headerTintColor: colors.primary }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Floating Back Button */}
        <TouchableOpacity style={styles.floatingBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Photo Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImage(slide);
            }}
            scrollEventThrottle={16}
          >
            {photos.length > 0 ? (
              photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo.url }} style={styles.galleryImage} />
              ))
            ) : (
              <View style={[styles.galleryImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              </View>
            )}
          </ScrollView>
          
          {photos.length > 1 && (
            <View style={styles.dotsContainer}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, activeImage === index && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{property.title}</Text>
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
          
          <Text style={styles.price}>
            {formatCurrency(property.pricePerYear)}
            <Text style={styles.priceUnit}> / yr</Text>
          </Text>

          {/* Amenities Chips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesContainer}>
              <View style={styles.amenityChip}>
                <Ionicons name="bed-outline" size={16} color={colors.text} />
                <Text style={styles.amenityText}>{property.bedrooms} Beds</Text>
              </View>
              <View style={styles.amenityChip}>
                <Ionicons name="water-outline" size={16} color={colors.text} />
                <Text style={styles.amenityText}>{property.bathrooms} Baths</Text>
              </View>
              {property.amenities.map((amenity, idx) => (
                <View key={idx} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>

          {/* Map Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={48} color={colors.textSecondary} />
              <Text style={styles.mapText}>Interactive Map coming soon</Text>
            </View>
          </View>

          {/* Landlord Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Landlord</Text>
            <View style={styles.landlordCard}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={colors.surface} />
              </View>
              <View style={styles.landlordInfo}>
                <Text style={styles.landlordName}>ID: {property.landlordId}</Text>
                <Text style={styles.landlordMeta}>Member since 2023 • 4.8 ⭐️</Text>
              </View>
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {reviews.length === 0 ? (
              <Text style={styles.descriptionText}>No reviews yet.</Text>
            ) : (
              reviews.map((review: Review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>Tenant {review.reviewerId}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reviewRating}>{'⭐️'.repeat(review.rating)}</Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarPriceContainer}>
          <Text style={styles.bottomBarPrice}>{formatCurrency(property.pricePerYear)}</Text>
          <Text style={styles.bottomBarUnit}>Total per year</Text>
        </View>
        <Button 
          title={activeBooking ? (activeBooking.status === 'ACCEPTED' ? 'Pay Now' : 'View Booking') : "Request Booking"} 
          onPress={() => {
            if (activeBooking) {
              router.push(`/(tenant)/booking/${activeBooking.id}` as any);
            } else {
              setBookingModalVisible(true);
            }
          }} 
          style={styles.bookButton} 
        />
      </View>

      {/* Booking Modal */}
      <Modal visible={isBookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Booking</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Move-in Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={moveInDate}
              onChangeText={setMoveInDate}
              placeholder="2025-01-01"
            />

            <Text style={styles.inputLabel}>Duration (Months)</Text>
            <TextInput
              style={styles.textInput}
              value={durationMonths}
              onChangeText={setDurationMonths}
              keyboardType="number-pad"
            />

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalPrice}>{formatCurrency(computedTotal)}</Text>
            </View>

            <Button
              title="Confirm Request"
              onPress={handleBookingSubmit}
              isLoading={createBookingMutation.isPending}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  floatingBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  galleryContainer: {
    height: 300,
    width: SCREEN_WIDTH,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  placeholderImage: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: spacing.md,
    flexDirection: 'row',
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.xl,
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
  price: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  priceUnit: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  descriptionText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  landlordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  landlordInfo: {
    flex: 1,
  },
  landlordName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  landlordMeta: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reviewCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reviewerName: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  reviewDate: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  reviewRating: {
    marginBottom: spacing.xs,
  },
  reviewComment: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  bottomBarPriceContainer: {
    flex: 1,
  },
  bottomBarPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  bottomBarUnit: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  bookButton: {
    flex: 1,
    marginVertical: 0,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    ...Platform.select({
      ios: { paddingBottom: 40 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  totalPrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
});
