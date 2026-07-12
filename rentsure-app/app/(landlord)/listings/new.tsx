/**
 * Create New Listing Wizard.
 *
 * A 5-step flow for landlords to create a property listing. Each step has
 * its own Zod schema; the "Next" button is disabled until the current step
 * is valid. Photos are added via expo-image-picker and validated ≤5MB before
 * being added to the draft — this check is client-side only and must also
 * be enforced server-side at upload time.
 *
 * Steps:
 *   1. Basics     — title, type, description
 *   2. Location   — region/city/area (seeded from Ghana regions)
 *   3. Pricing    — price, beds, baths, amenities multi-select
 *   4. Photos     — pick up to 10 photos, tap to remove
 *   5. Review     — summary + submit
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { useCreateProperty } from '@/hooks/useProperties';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/format';
import type { PropertyType, CreatePropertyRequest } from '@/types';

import { GHANA_REGIONS, CITY_AREAS, PROPERTY_TYPES, AMENITY_OPTIONS } from '@/constants/options';

// ---------------------------------------------------------------------------
// Zod schemas per step — validation fails here before proceeding
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(30, 'Description must be at least 30 characters'),
  propertyType: z.enum(['SINGLE_ROOM', 'SELF_CONTAINED', 'APARTMENT', 'HOUSE']),
});

const step2Schema = z.object({
  region: z.string().min(1, 'Select a region'),
  city: z.string().min(1, 'Select a city'),
  area: z.string().min(1, 'Enter the area'),
});

const step3Schema = z.object({
  pricePerYear: z.coerce.number().min(1000, 'Minimum GHS 1,000/year'),
  bedrooms: z.number().min(1, 'At least 1 bedroom'),
  bathrooms: z.number().min(0),
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
});

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  description: string;
  propertyType: PropertyType | '';
  region: string;
  city: string;
  area: string;
  pricePerYear: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string[];
  photoUris: string[];
}

const initialState: FormState = {
  title: '', description: '', propertyType: '',
  region: '', city: '', area: '',
  pricePerYear: '', bedrooms: '1', bathrooms: '0',
  amenities: [], photoUris: [],
};

type ValidationErrors = Partial<Record<keyof FormState, string>>;

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.indicator}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.indicatorDot,
            i < current && styles.indicatorDotDone,
            i === current && styles.indicatorDotActive,
          ]}
        />
      ))}
      <Text style={styles.indicatorText}>Step {current + 1} of {total}</Text>
    </View>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <Text style={styles.fieldError}>{msg}</Text>;
}

// ---------------------------------------------------------------------------
// Wizard Steps
// ---------------------------------------------------------------------------

interface StepProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: ValidationErrors;
}

function Step1Basics({ form, setForm, errors }: StepProps) {
  return (
    <View style={styles.stepBody}>
      <Text style={styles.fieldLabel}>Property Title *</Text>
      <TextInput
        style={[styles.input, !!errors.title && styles.inputError]}
        value={form.title}
        onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
        placeholder="e.g. Cozy 2-Bedroom in East Legon"
        placeholderTextColor={colors.textSecondary}
      />
      <FieldError msg={errors.title} />

      <Text style={styles.fieldLabel}>Property Type *</Text>
      <View style={styles.chipRow}>
        {PROPERTY_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, form.propertyType === t.value && styles.chipSelected]}
            onPress={() => setForm((f) => ({ ...f, propertyType: t.value }))}
          >
            <Text style={[styles.chipText, form.propertyType === t.value && styles.chipTextSelected]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FieldError msg={errors.propertyType} />

      <Text style={styles.fieldLabel}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea, !!errors.description && styles.inputError]}
        value={form.description}
        onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
        placeholder="Describe the property, neighbourhood, and what makes it special…"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      <FieldError msg={errors.description} />
    </View>
  );
}

function Step2Location({ form, setForm, errors }: StepProps) {
  const regions = Object.keys(GHANA_REGIONS);
  const cities = form.region ? GHANA_REGIONS[form.region] ?? [] : [];
  const areas = form.city ? CITY_AREAS[form.city] ?? [] : [];

  return (
    <View style={styles.stepBody}>
      <Text style={styles.fieldLabel}>Region *</Text>
      <View style={styles.chipRow}>
        {regions.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, form.region === r && styles.chipSelected]}
            onPress={() => setForm((f) => ({ ...f, region: r, city: '', area: '' }))}
          >
            <Text style={[styles.chipText, form.region === r && styles.chipTextSelected]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FieldError msg={errors.region} />

      {cities.length > 0 && (
        <>
          <Text style={styles.fieldLabel}>City *</Text>
          <View style={styles.chipRow}>
            {cities.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, form.city === c && styles.chipSelected]}
                onPress={() => setForm((f) => ({ ...f, city: c, area: '' }))}
              >
                <Text style={[styles.chipText, form.city === c && styles.chipTextSelected]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FieldError msg={errors.city} />
        </>
      )}

      <Text style={styles.fieldLabel}>Area / Neighbourhood *</Text>
      {areas.length > 0 && (
        <View style={styles.chipRow}>
          {areas.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.chip, form.area === a && styles.chipSelected]}
              onPress={() => setForm((f) => ({ ...f, area: a }))}
            >
              <Text style={[styles.chipText, form.area === a && styles.chipTextSelected]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        style={[styles.input, !!errors.area && styles.inputError]}
        value={form.area}
        onChangeText={(v) => setForm((f) => ({ ...f, area: v }))}
        placeholder="Or type your area…"
        placeholderTextColor={colors.textSecondary}
      />
      <FieldError msg={errors.area} />
    </View>
  );
}

function Step3Pricing({ form, setForm, errors }: StepProps) {
  const toggle = (amenity: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));
  };

  const adjust = (field: 'bedrooms' | 'bathrooms', delta: number) => {
    setForm((f) => ({
      ...f,
      [field]: String(Math.max(field === 'bathrooms' ? 0 : 1, (parseInt(f[field]) || 0) + delta)),
    }));
  };

  return (
    <View style={styles.stepBody}>
      <Text style={styles.fieldLabel}>Rent (GHS per year) *</Text>
      <TextInput
        style={[styles.input, !!errors.pricePerYear && styles.inputError]}
        value={form.pricePerYear}
        onChangeText={(v) => setForm((f) => ({ ...f, pricePerYear: v }))}
        placeholder="e.g. 12000"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
      />
      <FieldError msg={errors.pricePerYear} />

      <View style={styles.counterRow}>
        <View style={styles.counter}>
          <Text style={styles.counterLabel}>Bedrooms</Text>
          <View style={styles.counterControls}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => adjust('bedrooms', -1)}>
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{form.bedrooms}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => adjust('bedrooms', 1)}>
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterLabel}>Bathrooms</Text>
          <View style={styles.counterControls}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => adjust('bathrooms', -1)}>
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{form.bathrooms}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => adjust('bathrooms', 1)}>
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Amenities * (select all that apply)</Text>
      <View style={styles.chipRow}>
        {AMENITY_OPTIONS.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.chip, form.amenities.includes(a) && styles.chipSelected]}
            onPress={() => toggle(a)}
          >
            <Text style={[styles.chipText, form.amenities.includes(a) && styles.chipTextSelected]}>
              {a}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FieldError msg={errors.amenities} />
    </View>
  );
}

function Step4Photos({ form, setForm }: StepProps) {
  const MAX_PHOTOS = 10;
  // 5MB in bytes — validated client-side; the real upload endpoint also rejects large files
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;

  const pickPhoto = async () => {
    if (form.photoUris.length >= MAX_PHOTOS) {
      Alert.alert('Photo limit reached', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const valid: string[] = [];
      for (const asset of result.assets) {
        // expo-image-picker returns file:// URIs on Android; convert before multipart in prod
        if (asset.fileSize && asset.fileSize > MAX_SIZE_BYTES) {
          Alert.alert('File too large', `"${asset.fileName}" exceeds 5MB and was skipped.`);
          continue;
        }
        valid.push(asset.uri);
      }
      setForm((f) => ({
        ...f,
        photoUris: [...f.photoUris, ...valid].slice(0, MAX_PHOTOS),
      }));
    }
  };

  const remove = (uri: string) => {
    setForm((f) => ({ ...f, photoUris: f.photoUris.filter((u) => u !== uri) }));
  };

  return (
    <View style={styles.stepBody}>
      <Text style={styles.fieldLabel}>Photos ({form.photoUris.length}/{MAX_PHOTOS})</Text>
      <Text style={styles.helpText}>Clear, well-lit photos significantly increase booking rates.</Text>

      <View style={styles.photoGrid}>
        {form.photoUris.map((uri) => (
          <View key={uri} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
            <TouchableOpacity style={styles.removePhoto} onPress={() => remove(uri)}>
              <Ionicons name="close-circle" size={22} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}
        {form.photoUris.length < MAX_PHOTOS && (
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
            <Ionicons name="camera" size={28} color={colors.textSecondary} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Step5Review({ form }: StepProps) {
  const type = PROPERTY_TYPES.find((t) => t.value === form.propertyType)?.label;
  return (
    <View style={styles.stepBody}>
      <Text style={styles.reviewSectionTitle}>Basics</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Title: </Text>{form.title}</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Type: </Text>{type}</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Description: </Text>{form.description}</Text>

      <Text style={styles.reviewSectionTitle}>Location</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Region: </Text>{form.region}</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>City: </Text>{form.city}</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Area: </Text>{form.area}</Text>

      <Text style={styles.reviewSectionTitle}>Pricing & Rooms</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Price: </Text>{formatCurrency(Number(form.pricePerYear))}/yr</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Bedrooms: </Text>{form.bedrooms}</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Bathrooms: </Text>{form.bathrooms}</Text>
      <Text style={styles.reviewRow}><Text style={styles.reviewKey}>Amenities: </Text>{form.amenities.join(', ')}</Text>

      <Text style={styles.reviewSectionTitle}>Photos</Text>
      <Text style={styles.reviewRow}>{form.photoUris.length} photo(s) selected</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Validation per step
// ---------------------------------------------------------------------------

function validateStep(step: number, form: FormState): ValidationErrors {
  const errs: ValidationErrors = {};

  if (step === 0) {
    const result = step1Schema.safeParse({
      title: form.title,
      description: form.description,
      propertyType: form.propertyType,
    });
    if (!result.success) {
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof ValidationErrors;
        errs[key] = i.message;
      });
    }
  }

  if (step === 1) {
    const result = step2Schema.safeParse({
      region: form.region,
      city: form.city,
      area: form.area,
    });
    if (!result.success) {
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof ValidationErrors;
        errs[key] = i.message;
      });
    }
  }

  if (step === 2) {
    const result = step3Schema.safeParse({
      pricePerYear: form.pricePerYear ? Number(form.pricePerYear) : undefined,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      amenities: form.amenities,
    });
    if (!result.success) {
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof ValidationErrors;
        errs[key] = i.message;
      });
    }
  }

  return errs;
}

// ---------------------------------------------------------------------------
// Main Wizard Screen
// ---------------------------------------------------------------------------

const STEP_TITLES = ['Basics', 'Location', 'Pricing', 'Photos', 'Review'];

export default function NewListingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createMutation = useCreateProperty();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Verification guard
  if (user?.verificationStatus !== 'APPROVED') {
    return (
      <Screen noPadding>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>New Listing</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.unverifiedContainer}>
          <Ionicons 
            name={user?.verificationStatus === 'PENDING' ? 'time-outline' : 'shield-checkmark-outline'} 
            size={64} 
            color={colors.primary} 
          />
          <Text style={styles.unverifiedTitle}>
            {user?.verificationStatus === 'PENDING' ? 'Verification Pending' : 'Verification Required'}
          </Text>
          <Text style={styles.unverifiedDesc}>
            {user?.verificationStatus === 'PENDING' 
              ? 'Your identity documents are currently being reviewed. You will be able to create listings once approved.'
              : 'To ensure a safe platform for our tenants, all landlords must verify their identity before creating listings.'}
          </Text>
          
          {user?.verificationStatus !== 'PENDING' && (
            <Button 
              title="Get Verified Now" 
              onPress={() => router.replace('/(landlord)/verify' as any)}
              style={styles.verifyBtn}
            />
          )}
        </View>
      </Screen>
    );
  }

  const stepProps = { form, setForm, errors };

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    if (!user) return;

    const req: CreatePropertyRequest = {
      title: form.title,
      description: form.description,
      propertyType: form.propertyType as PropertyType,
      region: form.region,
      city: form.city,
      area: form.area,
      pricePerYear: Number(form.pricePerYear),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      amenities: form.amenities,
      photoUris: form.photoUris,
    };

    createMutation.mutate(
      { landlordId: user.id, req },
      {
        onSuccess: (res) => {
          if (res.success) {
            Alert.alert('Listing Created!', 'Your property is now live and visible to tenants.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } else {
            Alert.alert('Error', res.error?.message ?? 'Could not create listing');
          }
        },
      }
    );
  };

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <Screen noPadding>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{STEP_TITLES[step]}</Text>
        <View style={{ width: 24 }} />
      </View>

      <StepIndicator current={step} total={STEP_TITLES.length} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 0 && <Step1Basics {...stepProps} />}
        {step === 1 && <Step2Location {...stepProps} />}
        {step === 2 && <Step3Pricing {...stepProps} />}
        {step === 3 && <Step4Photos {...stepProps} />}
        {step === 4 && <Step5Review {...stepProps} />}
      </ScrollView>

      <View style={styles.navBar}>
        <Button
          title={isLastStep ? 'Submit Listing' : 'Next'}
          onPress={isLastStep ? handleSubmit : handleNext}
          isLoading={createMutation.isPending}
        />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  indicatorDotDone: {
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  indicatorDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  indicatorText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  stepBody: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  helpText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: typography.sizes.sm,
    color: '#DC2626',
    marginTop: 2,
  },
  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: typography.weights.medium,
  },
  // Counters
  counterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  counter: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  counterLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  // Photo grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  // Review step
  reviewSectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewRow: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  reviewKey: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  // Nav bar
  navBar: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  unverifiedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  unverifiedTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  unverifiedDesc: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  verifyBtn: {
    width: '100%',
  },
});
