/**
 * Property Detail Screen.
 *
 * Displays full property details, landlord information, and reviews.
 * Includes a sticky bottom bar to initiate the booking request flow.
 */

import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { Video, ResizeMode } from 'expo-av';
import { Image as ExpoImage } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperty } from '@/hooks/useProperties';
import { usePropertyReviews } from '@/hooks/useReviews';
import { useCreateBooking, useMyBookings } from '@/hooks/useBookings';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { supabase } from '@/api/supabase';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import { usePreferences } from '@/hooks/usePreferences';
import { computeCompatibility } from '@/utils/compatibility';
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
  const { data: prefs } = usePreferences(user?.role === 'TENANT' ? user.id : undefined);

  const activeBooking = bookingsData?.data?.find(b => 
    b.propertyId === id && 
    ['REQUESTED', 'ACCEPTED', 'PAID_ESCROW', 'MOVED_IN'].includes(b.status)
  );

  const [activeImage, setActiveImage] = useState(0);
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  
  // Booking Form State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [moveInDate, setMoveInDate] = useState(date.toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState('12');

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    setMoveInDate(currentDate.toISOString().split('T')[0]);
  };

  if (isPropertyLoading) {
    return (
      <Screen noPadding>
        <View style={styles.topBarSkeleton}>
          <Skeleton width={32} height={32} radius={16} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Skeleton width={SCREEN_WIDTH} height={300} style={{ marginBottom: spacing.lg }} />
          <View style={styles.content}>
            <Skeleton width={200} height={32} style={{ marginBottom: spacing.xs }} />
            <Skeleton width={150} height={20} style={{ marginBottom: spacing.md }} />
            <Skeleton width={120} height={28} style={{ marginBottom: spacing.xl }} />
            
            <View style={styles.section}>
              <Skeleton width={150} height={24} style={{ marginBottom: spacing.sm }} />
              <View style={styles.amenitiesContainer}>
                <Skeleton width={80} height={36} radius={ borderRadius.md } />
                <Skeleton width={90} height={36} radius={ borderRadius.md } />
                <Skeleton width={100} height={36} radius={ borderRadius.md } />
              </View>
            </View>

            <View style={styles.section}>
              <Skeleton width={120} height={24} style={{ marginBottom: spacing.sm }} />
              <Skeleton width="100%" height={20} style={{ marginBottom: 4 }} />
              <Skeleton width="100%" height={20} style={{ marginBottom: 4 }} />
              <Skeleton width="80%" height={20} />
            </View>

            <View style={styles.section}>
              <Skeleton width={100} height={24} style={{ marginBottom: spacing.sm }} />
              <View style={styles.landlordCard}>
                <Skeleton width={48} height={48} radius={24} style={{ marginRight: spacing.md }} />
                <View style={styles.landlordInfo}>
                  <Skeleton width={120} height={20} style={{ marginBottom: 4 }} />
                  <Skeleton width={150} height={16} />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={styles.bottomBar}>
          <Skeleton width={120} height={32} />
          <Skeleton width="40%" height={48} radius={ borderRadius.md } />
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

  const [landlordVerified, setLandlordVerified] = useState(false);
  useEffect(() => {
    if (property?.landlordId) {
      supabase.from('profiles').select('is_verified').eq('id', property.landlordId).single()
        .then(({ data }) => { if (data) setLandlordVerified(data.is_verified); });
    }
  }, [property?.landlordId]);

  const [showTooltip, setShowTooltip] = useState(false);

  const reviews = reviewsData?.data || [];
  const mediaItems = [...(property.media || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const photoItems = mediaItems.filter((m) => m.mediaType === 'PHOTO');
  const photoUrls = photoItems.map((m) => ({ uri: m.url }));
  const score = prefs ? computeCompatibility(prefs, property) : null;

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
            router.push('/(tenant)/bookings' as any);
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

        {/* Media Gallery */}
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
            {mediaItems.length > 0 ? (
              mediaItems.map((media, index) => {
                if (media.mediaType === 'VIDEO') {
                  return (
                    <View key={index} style={styles.galleryImage}>
                      <Video
                        source={{ uri: media.url }}
                        style={StyleSheet.absoluteFill}
                        useNativeControls
                        resizeMode={ResizeMode.COVER}
                        isLooping={false}
                      />
                    </View>
                  );
                } else {
                  return (
                    <TouchableOpacity 
                      key={index} 
                      activeOpacity={0.9} 
                      onPress={() => {
                        const photoIndex = photoItems.findIndex(p => p.id === media.id);
                        if (photoIndex !== -1) {
                          setImageViewerIndex(photoIndex);
                          setImageViewerVisible(true);
                        }
                      }}
                    >
                      <ExpoImage 
                        source={{ uri: media.url }} 
                        style={styles.galleryImage} 
                        contentFit="cover"
                        transition={300}
                      />
                    </TouchableOpacity>
                  );
                }
              })
            ) : (
              <View style={[styles.galleryImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={48} color={colors.border} />
                <Text style={styles.placeholderText}>No media available</Text>
              </View>
            )}
          </ScrollView>
          
          {mediaItems.length > 1 && (
            <View style={styles.dotsContainer}>
              {mediaItems.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, activeImage === index && styles.dotActive]}
                />
              ))}
            </View>
          )}

          <ImageViewing
            images={photoUrls}
            imageIndex={imageViewerIndex}
            visible={isImageViewerVisible}
            onRequestClose={() => setImageViewerVisible(false)}
          />
        </View>
<View style={styles.content}>
          {/* Header Info */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{property.title}</Text>
          </View>
          <View style={styles.badgesRow}>
            {property.isVerified && (
              <View style={[styles.badge, { backgroundColor: '#14B8A6' }]}>
                <Ionicons name="shield-checkmark" size={14} color={colors.surface} />
                <Text style={styles.badgeText}>Verified Property</Text>
              </View>
            )}
            {landlordVerified && (
              <View style={[styles.badge, { backgroundColor: '#D97706' }]}>
                <Ionicons name="person-circle" size={14} color={colors.surface} />
                <Text style={styles.badgeText}>Verified Landlord</Text>
              </View>
            )}
            {(property.isVerified || landlordVerified) && (
              <TouchableOpacity onPress={() => setShowTooltip(true)}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
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

          {/* Compatibility Breakdown */}
          {score && (
            <View style={styles.section}>
              <View style={styles.scoreHeaderRow}>
                <Text style={styles.sectionTitle}>Compatibility Match</Text>
                <View style={[
                  styles.scoreBadgeLarge, 
                  { backgroundColor: score.total >= 75 ? colors.success : score.total >= 50 ? colors.warning : colors.textSecondary }
                ]}>
                  {score.factors.some(f => f.score === 0 && f.key === 'AMENITIES' && f.detail.startsWith('Missing:')) && (
                    <View style={styles.dealbreakerDotLarge} />
                  )}
                  <Text style={styles.scoreBadgeTextLarge}>{score.total}%</Text>
                </View>
              </View>
              
              <View style={styles.factorsContainer}>
                {score.factors.map(factor => (
                  <TouchableOpacity 
                    key={factor.key} 
                    style={styles.factorRow}
                    onPress={() => router.push('/(tenant)/preferences')}
                  >
                    <View style={styles.factorHeader}>
                      <Text style={styles.factorLabel}>{factor.label}</Text>
                      <Text style={styles.factorScore}>{factor.score} / {factor.maxScore}</Text>
                    </View>
                    <View style={styles.factorBarBg}>
                      <View 
                        style={[
                          styles.factorBarFill, 
                          { 
                            width: `${factor.maxScore > 0 ? (factor.score / factor.maxScore) * 100 : 0}%`,
                            backgroundColor: factor.score === factor.maxScore ? colors.success : (factor.score > 0 ? colors.primary : colors.textSecondary)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.factorDetail}>{factor.detail}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text style={styles.landlordName}>ID: {property.landlordId}</Text>
                  {landlordVerified && (
                    <Ionicons name="person-circle" size={20} color="#D97706" />
                  )}
                </View>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Request Booking</Text>
                    <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Move-in Date</Text>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                      />
                    </View>
                  ) : (
                    <View>
                      <TouchableOpacity 
                        style={[styles.inputContainer, styles.datePickerBtn]} 
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={styles.textInput}>{moveInDate}</Text>
                        <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={date}
                          mode="date"
                          display="default"
                          onChange={onDateChange}
                        />
                      )}
                    </View>
                  )}

                  <Text style={styles.inputLabel}>Duration (Months)</Text>
                  <View style={[styles.inputContainer, styles.compactInput]}>
                    <TextInput
                      style={styles.textInput}
                      value={durationMonths}
                      onChangeText={setDurationMonths}
                      keyboardType="number-pad"
                    />
                  </View>

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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Tooltip Modal */}
      <Modal visible={showTooltip} transparent animationType="fade" onRequestClose={() => setShowTooltip(false)}>
        <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={() => setShowTooltip(false)}>
          <View style={styles.tooltipCard}>
            <Text style={styles.tooltipTitle}>What do these badges mean?</Text>
            <View style={styles.tooltipRow}>
              <Ionicons name="shield-checkmark" size={20} color="#14B8A6" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.tooltipRowTitle}>Verified Property</Text>
                <Text style={styles.tooltipRowDesc}>We have verified the land title or utility bills for this specific property.</Text>
              </View>
            </View>
            <View style={styles.tooltipRow}>
              <Ionicons name="person-circle" size={20} color="#D97706" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.tooltipRowTitle}>Verified Landlord</Text>
                <Text style={styles.tooltipRowDesc}>We have verified this person's identity using their Ghana Card.</Text>
              </View>
            </View>
            <Button title="Got it" onPress={() => setShowTooltip(false)} style={{ marginTop: spacing.md }} />
          </View>
        </TouchableOpacity>
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
  topBarSkeleton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: spacing.md,
    zIndex: 10,
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
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
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
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  datePickerContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  datePickerBtn: {
    justifyContent: 'space-between',
    paddingRight: spacing.md,
  },
  compactInput: {
    width: 120,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inputDoneButton: {
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    height: '100%',
  },
  inputDoneText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
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
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  scoreBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  scoreBadgeTextLarge: {
    color: colors.surface,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  dealbreakerDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  factorsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  factorRow: {
    gap: 4,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  factorLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  factorScore: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  factorBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorDetail: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  tooltipCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  tooltipRowTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tooltipRowDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
