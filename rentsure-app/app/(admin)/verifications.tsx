import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert, Image, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminVerifications, useApproveVerification, useRejectVerification, useAdminUsers } from '@/hooks/useAdmin';
import { useProperties } from '@/hooks/useProperties';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { typography, colors, spacing, borderRadius } from '@/constants/theme';
import type { Verification } from '@/types';

export default function AdminVerifications() {
  const { data, isLoading, refetch } = useAdminVerifications();
  const { data: usersData } = useAdminUsers({ role: 'LANDLORD' });
  const { data: propertiesData } = useProperties({});
  const approveMutation = useApproveVerification();
  const rejectMutation = useRejectVerification();

  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);

  const verifications = data?.data?.content || [];
  const pending = verifications.filter((v) => v.status === 'PENDING');

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
    Alert.alert(
      'Reject Verification',
      'Are you sure you want to reject these documents?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            rejectMutation.mutate(verification.id, {
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

  const renderItem = ({ item }: { item: Verification }) => {
    const landlord = usersData?.data?.content?.find((u) => u.id === item.landlordId);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.docType}>{item.docType.replace('_', ' ')}</Text>
          <Text style={styles.submittedDate}>
            {new Date(item.submittedAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.landlordId}>
          Landlord: {landlord ? `${landlord.fullName} (${landlord.email})` : item.landlordId}
        </Text>
        {item.propertyId && (
          <Text style={styles.propertyText}>
            Property ID: {item.propertyId}
          </Text>
        )}
        <Button 
          title="Review Documents" 
          onPress={() => setSelectedVerification(item)} 
          style={styles.reviewBtn}
        />
      </View>
    );
  };

  return (
    <Screen noPadding>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Verification Queue</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No pending verifications</Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal
        visible={!!selectedVerification}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedVerification(null)}
      >
        {selectedVerification && (
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Review Document</Text>
                <TouchableOpacity onPress={() => setSelectedVerification(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.docTypeModal}>{selectedVerification.docType.replace('_', ' ')}</Text>
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

              <View style={styles.actionRow}>
                <Button 
                  title="Reject" 
                  onPress={() => handleReject(selectedVerification)} 
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
            </View>
          </View>
        )}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: typography.sizes.lg,
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
    backgroundColor: colors.background,
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
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfBtn: {
    flex: 1,
    marginVertical: 0,
  },
});
