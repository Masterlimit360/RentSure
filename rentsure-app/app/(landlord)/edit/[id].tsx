/**
 * Edit Property Screen
 * 
 * Allows landlords to edit the title, description, and pricing of their existing listings.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProperty, useUpdateProperty } from '@/hooks/useProperties';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Skeleton } from '@/components/ui/Skeleton';

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  
  const { data, isLoading } = useProperty(id as string);
  const updateMutation = useUpdateProperty();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  useEffect(() => {
    if (data?.data) {
      setTitle(data.data.title);
      setDescription(data.data.description);
      setPrice(data.data.pricePerYear.toString());
      setPhotoUris(data.data.media?.map(m => m.url) || []);
    }
  }, [data]);

  if (isLoading) {
    return (
      <Screen noPadding style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Property</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Skeleton width={120} height={16} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="100%" height={48} radius={borderRadius.md} style={{ marginBottom: spacing.md }} />
            
            <Skeleton width={120} height={16} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="100%" height={100} radius={borderRadius.md} style={{ marginBottom: spacing.md }} />
            
            <Skeleton width={120} height={16} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="100%" height={48} radius={borderRadius.md} style={{ marginBottom: spacing.md }} />

            <Skeleton width="100%" height={52} radius={borderRadius.md} style={{ marginTop: spacing.md }} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  const property = data?.data;
  if (!property || property.landlordId !== user?.id) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.errorText}>Property not found or unauthorized.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: spacing.md }} />
      </Screen>
    );
  }

  const handleSave = () => {
    const numPrice = Number(price);
    if (!title || !description || isNaN(numPrice) || numPrice <= 0) {
      showToast('Please fill out all fields with valid data.', 'error');
      return;
    }
    if (photoUris.length === 0) {
      showToast('Please add at least one photo.', 'error');
      return;
    }

    updateMutation.mutate(
      {
        landlordId: user!.id,
        propertyId: property.id,
        req: {
          title,
          description,
          pricePerYear: numPrice,
          photoUris,
        },
      },
      {
        onSuccess: () => {
          showToast('Property updated successfully.');
          router.back();
        },
        onError: () => {
          showToast('Failed to update property.', 'error');
        },
      }
    );
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        setPhotoUris([...photoUris, ...result.assets.map(a => a.uri)]);
      }
    } catch (error) {
      showToast('Failed to pick image.', 'error');
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <TextField
              label="Property Title"
              placeholder="e.g. Spacious 2-Bedroom Appt"
              value={title}
              onChangeText={setTitle}
            />
            
            <TextField
              label="Description"
              placeholder="Describe your property..."
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={styles.textArea}
            />

            <TextField
              label="Price per Year (GH₵)"
              placeholder="12000"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <Text style={styles.label}>Property Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoContainer}>
              {photoUris.map((uri, idx) => (
                <View key={idx} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(idx)}>
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage}>
                <Ionicons name="camera" size={32} color={colors.primary} />
                <Text style={styles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            </ScrollView>

            <Button
              title="Save Changes"
              onPress={handleSave}
              isLoading={updateMutation.isPending}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    ...Platform.select({
      ios: shadows.sm,
      android: shadows.sm,
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  photoContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  addPhotoText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    marginTop: 4,
  },
});
