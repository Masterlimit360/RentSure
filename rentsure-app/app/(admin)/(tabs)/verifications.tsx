import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminVerifications, useApproveVerification, useRejectVerification, useAdminUsers } from '@/hooks/useAdmin';
import { useProperties } from '@/hooks/useProperties';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { typography, colors, spacing, borderRadius, shadows } from '@/constants/theme';
import type { Verification } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';

type TabType = 'ALL' | 'IDENTITY' | 'PROPERTY';
type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

function VerificationSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={150} height={20} />
        <Skeleton width={80} height={14} />
      </View>
      <Skeleton width="60%" height={14} style={{ marginBottom: spacing.xs }} />
      <Skeleton width="40%" height={14} style={{ marginBottom: spacing.md }} />
      <Skeleton width="100%" height={40} radius={borderRadius.md} />
    </View>
  );
}

export default function AdminVerifications() {
  const { data, isLoading, isRefetching, refetch } = useAdminVerifications();
  const { data: usersData } = useAdminUsers({ role: 'LANDLORD' });
  const { data: propertiesData } = useProperties({});
  const approveMutation = useApproveVerification();
  const rejectMutation = useRejectVerification();

  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [activeStatus, setActiveStatus] = useState<StatusType>('PENDING');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const verifications = data?.data?.content || [];
  
  // Filter by Tab
  const tabFiltered = verifications.filter(v => {
    if (activeTab === 'IDENTITY') return v.propertyId == null;
    if (activeTab === 'PROPERTY') return v.propertyId != null;
    return true;
  });

  // Filter by Status
  const filtered = tabFiltered.filter(v => {
    if (activeStatus === 'ALL') return true;
    return v.status === activeStatus;
  });

  // Counts for tabs (always computed against activeStatus to show relevant counts)
  const allCount = verifications.filter(v => activeStatus === 'ALL' || v.status === activeStatus).length;
  const identityCount = verifications.filter(v => v.propertyId == null && (activeStatus === 'ALL' || v.status === activeStatus)).length;
  const propertyCount = verifications.filter(v => v.propertyId != null && (activeStatus === 'ALL' || v.status === activeStatus)).length;

  const handleApprove = (verification: Verification) => {
    Alert.alert(
      'Approve Verification',
      verification.docType === 'GHANA_CARD'
        ? 'This will mark the landlord identity as verified. Proceed?'
        : 'This will mark the specific property as verified. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            approveMutation.mutate(verification.id, {
              onSuccess: (res) => {
                if (res.success) {
                  setSelectedVerification(null);
                } else {
                  Alert.alert('Error', res.error?.message ?? 'Action failed');
                }
              }
            });
          },
        },
      ]
    );
  };

  const handleReject = (verification: Verification) => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }
    
    rejectMutation.mutate({ verificationId: verification.id, reason: rejectReason.trim() }, {
      onSuccess: (res) => {
        if (res.success) {
          setSelectedVerification(null);
          setIsRejecting(false);
          setRejectReason('');
        } else {
          Alert.alert('Error', res.error?.message ?? 'Action failed');
        }
      }
    });
  };

  const renderItem = ({ item, index }: { item: Verification; index: number }) => {
    const landlord = usersData?.data?.content?.find((u) => u.id === item.landlordId);
    const propertyTitle = item.propertyId 
      ? propertiesData?.data?.content?.find((p) => p.id === item.propertyId)?.title || item.propertyId 
      : null;

    const isPending = item.status === 'PENDING';
    
    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 50).springify()}
        layout={LinearTransition.springify()}
        style={[styles.card, !isPending && styles.cardInactive]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons 
              name={item.propertyId ? 'home' : 'person'} 
              size={16} 
              color={colors.primary} 
            />
            <Text style={styles.docType}>
              {item.propertyId ? 'Property:' : 'Identity:'} {item.docType.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.submittedDate}>
            {new Date(item.submittedAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.landlordId}>
          {landlord ? `${landlord.fullName} (${landlord.email})` : item.landlordId}
          {item.propertyId && landlord?.isVerified && (
             <Ionicons name="shield-checkmark" size={14} color={colors.success} style={{ marginLeft: 4 }} />
          )}
        </Text>
        
        {propertyTitle && (
          <Text style={styles.propertyText}>
            {propertyTitle}
          </Text>
        )}

        {!isPending && (
          <View style={[styles.decisionBadge, item.status === 'APPROVED' ? styles.badgeApproved : styles.badgeRejected]}>
            <Text style={styles.decisionText}>
              {item.status} {item.reviewedAt ? `on ${new Date(item.reviewedAt).toLocaleDateString()}` : ''}
            </Text>
          </View>
        )}

        <Button 
          title="Review Document" 
          onPress={() => setSelectedVerification(item)} 
          style={styles.reviewBtn}
          variant={isPending ? 'primary' : 'outline'}
        />
      </Animated.View>
    );
  };

  return (
    <Screen noPadding>
      {/* Top Segmented Tabs */}
      <View style={styles.tabsContainer}>
        {(['ALL', 'IDENTITY', 'PROPERTY'] as TabType[]).map((tab) => {
          const count = tab === 'ALL' ? allCount : tab === 'IDENTITY' ? identityCount : propertyCount;
          return (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Status Chips */}
      <View style={styles.chipsContainer}>
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as StatusType[]).map((status) => (
          <TouchableOpacity 
            key={status} 
            style={[styles.chip, activeStatus === status && styles.chipActive]}
            onPress={() => setActiveStatus(status)}
          >
            <Text style={[styles.chipText, activeStatus === status && styles.chipTextActive]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => <VerificationSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={renderItem as any}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No verifications found</Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal
        visible={!!selectedVerification}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setSelectedVerification(null);
          setIsRejecting(false);
          setRejectReason('');
        }}
      >
        {selectedVerification && (
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Review Document</Text>
                <TouchableOpacity onPress={() => {
                  setSelectedVerification(null);
                  setIsRejecting(false);
                  setRejectReason('');
                }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.docTypeModal}>
                {selectedVerification.propertyId ? 'Property Document:' : 'Landlord Identification:'} {selectedVerification.docType.replace('_', ' ')}
              </Text>
              <Text style={styles.landlordIdModal}>
                Landlord:{' '}
                {usersData?.data?.content?.find((u) => u.id === selectedVerification.landlordId)?.fullName ||
                  selectedVerification.landlordId}
              </Text>
              {selectedVerification.propertyId && (
                <Text style={styles.landlordIdModal}>
                  Property:{' '}
                  {propertiesData?.data?.content?.find((p) => p.id === selectedVerification.propertyId)?.title ||
                    selectedVerification.propertyId}
                </Text>
              )}

              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedVerification.docUrl }} style={styles.docImage} />
              </View>

              {selectedVerification.status === 'PENDING' ? (
                isRejecting ? (
                  <View style={styles.actionRow}>
                    <TextInput
                      style={styles.reasonInput}
                      placeholder="Reason for rejection..."
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      multiline
                    />
                    <View style={styles.actionButtonsRow}>
                      <Button 
                        title="Cancel" 
                        onPress={() => {
                          setIsRejecting(false);
                          setRejectReason('');
                        }} 
                        variant="outline"
                        style={styles.halfBtn} 
                      />
                      <Button 
                        title="Confirm Reject" 
                        onPress={() => handleReject(selectedVerification)} 
                        isLoading={rejectMutation.isPending}
                        style={[styles.halfBtn, { backgroundColor: colors.error }]} 
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <Button 
                      title="Reject" 
                      onPress={() => setIsRejecting(true)} 
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      style={[styles.halfBtn, { backgroundColor: colors.error }]} 
                    />
                    <Button 
                      title="Approve" 
                      onPress={() => handleApprove(selectedVerification)} 
                      isLoading={approveMutation.isPending}
                      disabled={rejectMutation.isPending}
                      style={styles.halfBtn} 
                    />
                  </View>
                )
              ) : (
                <View style={[styles.decisionBadge, selectedVerification.status === 'APPROVED' ? styles.badgeApproved : styles.badgeRejected, { alignSelf: 'center', marginTop: spacing.md }]}>
                  <Text style={styles.decisionText}>
                    Already {selectedVerification.status} {selectedVerification.reviewedAt ? `on ${new Date(selectedVerification.reviewedAt).toLocaleDateString()}` : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  chipsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.surface,
  },
  cardInactive: {
    opacity: 0.8,
    backgroundColor: '#F9FAFB',
  },
  decisionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  badgeApproved: {
    backgroundColor: '#D1FAE5',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  decisionText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  docType: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  submittedDate: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  landlordId: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  propertyText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  reviewBtn: {
    marginBottom: 0,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
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
    height: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  docTypeModal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  landlordIdModal: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  docImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  actionRow: {
    gap: spacing.md,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  halfBtn: {
    flex: 1,
    marginVertical: 0,
  },
});
