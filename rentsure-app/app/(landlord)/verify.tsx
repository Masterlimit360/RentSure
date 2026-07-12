/**
 * Landlord Verification Screen.
 * 
 * Allows an unverified landlord to submit documentation to prove their identity
 * and ownership. In the mock, this immediately sets them to APPROVED.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSubmitVerification } from '@/hooks/useVerification';
import { useProperties } from '@/hooks/useProperties';
import { useAuthStore } from '@/store/auth.store';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import type { VerificationDocType } from '@/types';

const DOC_TYPES: { type: VerificationDocType; label: string }[] = [
  { type: 'GHANA_CARD', label: 'Ghana Card' },
  { type: 'LAND_TITLE', label: 'Land Title Certificate' },
  { type: 'UTILITY_BILL', label: 'Utility Bill (Water/Electricity)' },
];

export default function VerifyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const verifyMutation = useSubmitVerification();
  const { data: propertiesData } = useProperties({});

  const myProperties = (propertiesData?.data?.content ?? []).filter(
    (p) => p.landlordId === user?.id
  );

  const [docType, setDocType] = useState<VerificationDocType>('GHANA_CARD');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleSubmit = () => {
    if (!imageUri) {
      Alert.alert('Missing Image', 'Please upload a photo of your document.');
      return;
    }
    if (docType !== 'GHANA_CARD' && !propertyId) {
      Alert.alert('Missing Property', 'Please select a property for this verification.');
      return;
    }

    verifyMutation.mutate(
      { docType, docUrl: imageUri, propertyId: propertyId || undefined },
      {
        onSuccess: (res) => {
          if (res.success) {
            Alert.alert(
              'Submitted',
              'Your documents have been submitted and verified successfully.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(landlord)/profile'),
                },
              ]
            );
          } else {
            Alert.alert('Error', res.error?.message ?? 'Verification failed.');
          }
        },
      }
    );
  };

  return (
    <Screen noPadding>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Get Verified</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.introText}>
          To maintain a safe platform for tenants, we require all landlords to verify their identity and property ownership.
        </Text>

        <Text style={styles.sectionTitle}>1. Select Document Type</Text>
        <View style={styles.docTypesList}>
          {DOC_TYPES.map((doc) => (
            <TouchableOpacity
              key={doc.type}
              style={[styles.docTypeBtn, docType === doc.type && styles.docTypeActive]}
              onPress={() => setDocType(doc.type)}
            >
              <Ionicons
                name={docType === doc.type ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={docType === doc.type ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.docTypeText, docType === doc.type && styles.docTypeTextActive]}>
                {doc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {docType !== 'GHANA_CARD' && (
          <>
            <Text style={styles.sectionTitle}>Select Property to Verify</Text>
            {myProperties.length === 0 ? (
              <Text style={styles.emptyPropertiesText}>You need to add a property first.</Text>
            ) : (
              <View style={styles.propertiesList}>
                {myProperties.map((prop) => (
                  <TouchableOpacity
                    key={prop.id}
                    style={[styles.docTypeBtn, propertyId === prop.id && styles.docTypeActive]}
                    onPress={() => setPropertyId(prop.id)}
                  >
                    <Ionicons
                      name={propertyId === prop.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={propertyId === prop.id ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.docTypeText, propertyId === prop.id && styles.docTypeTextActive]} numberOfLines={1}>
                      {prop.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>2. Upload Document Photo</Text>
        <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera-outline" size={40} color={colors.primary} />
              <Text style={styles.uploadPlaceholderText}>Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>

        <Button
          title="Submit for Verification"
          onPress={handleSubmit}
          isLoading={verifyMutation.isPending}
          style={styles.submitBtn}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  topBarTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  introText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  docTypesList: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  docTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  docTypeActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  docTypeText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  docTypeTextActive: {
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  uploadArea: {
    height: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadPlaceholderText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  propertiesList: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyPropertiesText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    marginBottom: spacing.xl,
  },
});
