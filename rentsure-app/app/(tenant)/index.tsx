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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PropertyCard } from '@/components/PropertyCard';
import { useInfiniteProperties } from '@/hooks/useProperties';
import { useAuthStore } from '@/store/auth.store';
import { useMyBookings } from '@/hooks/useBookings';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import type { PropertyType } from '@/types';

export default function TenantIndex() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [isFilterVisible, setFilterVisible] = useState(false);

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
    city: cityFilter || undefined,
    type: activeType,
    maxPrice: activeMaxPrice,
    // Minimum price is usually requested in advanced filtering, omitting for simplicity unless requested
  });

  const { data: bookingsData } = useMyBookings(user?.id ?? '', 'TENANT');
  const activeBookings = bookingsData?.data?.filter(b => 
    ['REQUESTED', 'ACCEPTED', 'PAID_ESCROW', 'MOVED_IN'].includes(b.status)
  ) || [];

  const properties = data?.pages.flatMap((page) => page.data?.content || []) || [];

  const applyFilters = () => {
    setActiveType(tempType);
    const parsedPrice = parseInt(tempMaxPrice, 10);
    setActiveMaxPrice(isNaN(parsedPrice) ? undefined : parsedPrice);
    setCityFilter(searchQuery);
    setFilterVisible(false);
  };

  const clearFilters = () => {
    setTempType(undefined);
    setTempMaxPrice('');
    setActiveType(undefined);
    setActiveMaxPrice(undefined);
    setSearchQuery('');
    setCityFilter('');
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
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city (e.g. Accra, Kumasi)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => setCityFilter(searchQuery)}
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
          data={properties}
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
        <View style={styles.modalOverlay}>
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
            <TextInput
              style={styles.priceInput}
              keyboardType="number-pad"
              placeholder="e.g. 15000"
              value={tempMaxPrice}
              onChangeText={setTempMaxPrice}
            />

            <View style={styles.modalFooter}>
              <Button title="Reset" onPress={clearFilters} variant="outline" style={{ flex: 1 }} />
              <Button title="Apply Filters" onPress={applyFilters} style={{ flex: 2 }} />
            </View>
          </View>
        </View>
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
    fontSize: typography.sizes.md,
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
    padding: spacing.md,
    color: colors.textSecondary,
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
  priceInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
