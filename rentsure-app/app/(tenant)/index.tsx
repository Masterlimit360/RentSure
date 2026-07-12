/**
 * Tenant Home / Property Search Screen.
 *
 * Displays an infinite scrolling list of properties. Includes a search bar
 * and a filter modal to narrow down results.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PropertyCard } from '@/components/PropertyCard';
import { useInfiniteProperties, useProperties } from '@/hooks/useProperties';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { useMyBookings } from '@/hooks/useBookings';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { usePreferences } from '@/hooks/usePreferences';
import { computeCompatibility } from '@/utils/compatibility';
import type { PropertyType } from '@/types';

export default function TenantIndex() {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [queryFilter, setQueryFilter] = useState('');
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sortByMatch, setSortByMatch] = useState(false);

  const { data: prefs } = usePreferences(user?.id);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter states
  const [tempType, setTempType] = useState<PropertyType | undefined>();
  const [tempMaxPrice, setTempMaxPrice] = useState<string>('');
  
  const [activeType, setActiveType] = useState<PropertyType | undefined>();
  const [activeMaxPrice, setActiveMaxPrice] = useState<number | undefined>();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteProperties({
    query: queryFilter || undefined,
    type: activeType,
    maxPrice: activeMaxPrice,
    // Minimum price is usually requested in advanced filtering, omitting for simplicity unless requested
  });

  const { data: suggestionsData, isFetching: isFetchingSuggestions } = useProperties(
    { query: debouncedSearchQuery, size: 5 },
    { enabled: debouncedSearchQuery.length > 1 }
  );
  
  const suggestions = suggestionsData?.data?.content || [];

  const { data: bookingsData } = useMyBookings(user?.id ?? '', 'TENANT');
  const activeBookings = bookingsData?.data?.filter(b => 
    ['REQUESTED', 'ACCEPTED', 'PAID_ESCROW', 'MOVED_IN'].includes(b.status)
  ) || [];

  const properties = data?.pages.flatMap((page) => page.data?.content || []) || [];

  let displayProperties = [...properties];
  if (prefs && sortByMatch) {
    displayProperties.sort((a, b) => {
      const scoreA = computeCompatibility(prefs, a).total;
      const scoreB = computeCompatibility(prefs, b).total;
      return scoreB - scoreA;
    });
  }

  const applyFilters = () => {
    setActiveType(tempType);
    const parsedPrice = parseInt(tempMaxPrice, 10);
    setActiveMaxPrice(isNaN(parsedPrice) ? undefined : parsedPrice);
    setQueryFilter(searchQuery);
    setIsFocused(false);
    setFilterVisible(false);
  };

  const clearFilters = () => {
    setTempType(undefined);
    setTempMaxPrice('');
    setActiveType(undefined);
    setActiveMaxPrice(undefined);
    setSearchQuery('');
    setQueryFilter('');
    setIsFocused(false);
    setFilterVisible(false);
  };

  const renderEmptyState = () => {
    if (isLoading) return null; // Wait for loading to finish
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No properties found</Text>
        <Text style={styles.emptyText}>Try adjusting your filters or search criteria.</Text>
        <Button title="Clear Filters" onPress={clearFilters} variant="outline" style={{ marginTop: spacing.md }} />
      </View>
    );
  };

  return (
    <Screen>
      <View style={{ zIndex: 10 }}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by city, title, or area..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Short delay to allow tap on suggestion to register before blur hides it
                setTimeout(() => setIsFocused(false), 200);
              }}
              onSubmitEditing={() => {
                setQueryFilter(searchQuery);
                setIsFocused(false);
              }}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, Boolean(activeType || activeMaxPrice) && styles.filterButtonActive]}
            onPress={() => {
              setTempType(activeType);
              setTempMaxPrice(activeMaxPrice ? activeMaxPrice.toString() : '');
              setFilterVisible(true);
            }}
          >
            <Ionicons
              name="options"
              size={24}
              color={(activeType || activeMaxPrice) ? colors.surface : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, { position: 'relative' }]} 
            onPress={() => router.push('/(tenant)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <View style={styles.badgeInner} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isFocused && searchQuery.length > 1 && (
          <View style={styles.suggestionsContainer}>
            {isFetchingSuggestions ? (
              <Text style={styles.suggestionsLoading}>Searching...</Text>
            ) : suggestions.length > 0 ? (
              suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setIsFocused(false);
                    setSearchQuery(item.title);
                    router.push(`/(tenant)/property/${item.id}`);
                  }}
                >
                  <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.suggestionSubtitle}>{item.area}, {item.city}</Text>
                  </View>
                  <Text style={styles.suggestionPrice}>GHS {item.pricePerYear}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.suggestionsLoading}>No properties found matching "{searchQuery}"</Text>
            )}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((item, index) => (
            <View key={item} style={[styles.skeletonCard, { marginTop: index === 0 ? spacing.md : 0 }]}>
              <Skeleton height={200} radius={0} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonHeaderRow}>
                  <Skeleton width="60%" height={24} />
                  <Skeleton width={60} height={20} radius={12} />
                </View>
                <Skeleton width="40%" height={16} style={{ marginBottom: spacing.md }} />
                <View style={styles.skeletonFooterRow}>
                  <Skeleton width="30%" height={24} />
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Skeleton width={40} height={20} />
                    <Skeleton width={40} height={20} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={displayProperties}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const activeBooking = activeBookings.find(b => b.propertyId === item.id);
            return <PropertyCard property={item} index={index} activeBookingStatus={activeBooking?.status} activeBookingId={activeBooking?.id} />;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.md }}>
              {!prefs ? (
                <View style={styles.ctaCard}>
                  <Text style={styles.ctaTitle}>Get personal match scores — 2 minutes</Text>
                  <Text style={styles.ctaDesc}>Take a quick quiz to see how well each property fits your budget and lifestyle.</Text>
                  <Button title="Take Quiz" onPress={() => router.push('/(tenant)/preferences' as any)} />
                </View>
              ) : (
                <View style={styles.sortToggleRow}>
                  <Text style={styles.sortToggleText}>Sort by Best Match</Text>
                  <TouchableOpacity
                    style={[styles.sortToggleBtn, sortByMatch && styles.sortToggleBtnActive]}
                    onPress={() => setSortByMatch(!sortByMatch)}
                  >
                    <View style={[styles.sortToggleThumb, sortByMatch && styles.sortToggleThumbActive]} />
                  </TouchableOpacity>
                  <Text style={styles.sortToggleNote}>(loaded results only)</Text>
                </View>
              )}
            </View>
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text style={styles.footerLoading}>Loading more...</Text>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filters</Text>
                    <TouchableOpacity onPress={() => setFilterVisible(false)}>
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.filterSectionTitle}>Property Type</Text>
                  <View style={styles.chipsContainer}>
                    {(['APARTMENT', 'HOUSE', 'STUDIO'] as PropertyType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.chip, tempType === type && styles.chipActive]}
                        onPress={() => setTempType(tempType === type ? undefined : type)}
                      >
                        <Text style={[styles.chipText, tempType === type && styles.chipTextActive]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.filterSectionTitle}>Max Price (GHS / year)</Text>
                  <View style={styles.priceInputContainer}>
                    <TextInput
                      style={styles.priceInput}
                      keyboardType="number-pad"
                      placeholder="e.g. 15000"
                      value={tempMaxPrice}
                      onChangeText={setTempMaxPrice}
                    />
                    <TouchableOpacity style={styles.inputDoneButton} onPress={Keyboard.dismiss}>
                      <Text style={styles.inputDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalFooter}>
                    <Button title="Reset" onPress={clearFilters} variant="outline" style={{ flex: 1 }} />
                    <Button title="Apply Filters" onPress={applyFilters} style={{ flex: 2 }} />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: typography.sizes.sm,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: spacing.md + 48 + spacing.sm,
    left: 0,
    right: 48 + spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  suggestionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  suggestionPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  suggestionsLoading: {
    padding: spacing.md,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonContent: {
    padding: spacing.md,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skeletonFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLoading: {
    textAlign: 'center',
    paddingVertical: spacing.md,
    color: colors.textSecondary,
  },
  ctaCard: {
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ctaTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  ctaDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  sortToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortToggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    flex: 1,
  },
  sortToggleBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  sortToggleBtnActive: {
    backgroundColor: colors.primary,
  },
  sortToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  sortToggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  sortToggleNote: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
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
  filterSectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: typography.weights.bold,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  priceInput: {
    flex: 1,
    height: 48,
    fontSize: typography.sizes.sm,
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
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});
