import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useAuthStore } from '@/store/auth.store';
import { usePreferences, useUpsertPreferences } from '@/hooks/usePreferences';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import {
  GHANA_REGIONS,
  CITY_AREAS,
  PROPERTY_TYPES,
  AMENITY_OPTIONS,
} from '@/constants/options';
import type { TenantPreferences, PropertyType } from '@/types';
import { useToastStore } from '@/store/toast.store';

// We extract all unique cities across regions for the City picker
const ALL_CITIES = Array.from(new Set(Object.values(GHANA_REGIONS).flat()));
// All unique areas across all cities for the Area picker
const ALL_AREAS = Array.from(new Set(Object.values(CITY_AREAS).flat()));

const STEP_TITLES = ['Budget', 'Location', 'Property Type', 'Rooms', 'Amenities'];

export default function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const { data: existingPrefs, isLoading: isLoadingPrefs } = usePreferences(user?.id);
  const upsertMutation = useUpsertPreferences();

  const [step, setStep] = useState(0);

  // Form State
  const [budget, setBudget] = useState('15000');
  const [cities, setCities] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [bedrooms, setBedrooms] = useState(1);
  const [reqAmenities, setReqAmenities] = useState<string[]>([]);
  const [niceAmenities, setNiceAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (existingPrefs) {
      setBudget(existingPrefs.budgetMaxPerYear.toString());
      setCities(existingPrefs.preferredCities || []);
      setAreas(existingPrefs.preferredAreas || []);
      setTypes(existingPrefs.propertyTypes || []);
      setBedrooms(existingPrefs.minBedrooms || 1);
      setReqAmenities(existingPrefs.requiredAmenities || []);
      setNiceAmenities(existingPrefs.niceToHaveAmenities || []);
    }
  }, [existingPrefs]);

  if (isLoadingPrefs) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  const handleBack = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const handleSave = () => {
    if (!user) return;
    
    const prefs: TenantPreferences = {
      userId: user.id,
      budgetMaxPerYear: Number(budget) || 0,
      preferredCities: cities,
      preferredAreas: areas,
      propertyTypes: types,
      minBedrooms: bedrooms,
      requiredAmenities: reqAmenities,
      niceToHaveAmenities: niceAmenities,
      updatedAt: new Date().toISOString(),
    };

    upsertMutation.mutate(prefs, {
      onSuccess: () => {
        showToast('Preferences saved successfully!');
        router.back();
      },
      onError: (err) => {
        showToast(err.message, 'error');
      },
    });
  };

  const toggleArrayItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<any[]>>) => {
    setList((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  // Toggle amenity with logic to move it between the two lists
  const toggleAmenity = (item: string, bucket: 'REQUIRED' | 'NICE') => {
    if (bucket === 'REQUIRED') {
      if (reqAmenities.includes(item)) {
        setReqAmenities((p) => p.filter((i) => i !== item));
      } else {
        setReqAmenities((p) => [...p, item]);
        setNiceAmenities((p) => p.filter((i) => i !== item)); // Remove from nice
      }
    } else {
      if (niceAmenities.includes(item)) {
        setNiceAmenities((p) => p.filter((i) => i !== item));
      } else {
        setNiceAmenities((p) => [...p, item]);
        setReqAmenities((p) => p.filter((i) => i !== item)); // Remove from required
      }
    }
  };

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <Screen noPadding style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{STEP_TITLES[step]}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.skipBtn}>Save & Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.indicator}>
        {Array.from({ length: STEP_TITLES.length }, (_, i) => (
          <View
            key={i}
            style={[
              styles.indicatorDot,
              i < step && styles.indicatorDotDone,
              i === step && styles.indicatorDotActive,
            ]}
          />
        ))}
        <Text style={styles.indicatorText}>
          Step {step + 1} of {STEP_TITLES.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <Animated.View key="step0" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepBody}>
            <Text style={styles.title}>What's your yearly budget?</Text>
            <Text style={styles.subtitle}>
              We use this to score properties. Anything below 80% of your budget scores perfectly!
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyLabel}>GHS</Text>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                keyboardType="number-pad"
              />
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="step1" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepBody}>
            <Text style={styles.title}>Where are you looking?</Text>
            <Text style={styles.subtitle}>Select preferred cities and areas. Leave empty to ignore location.</Text>
            
            <Text style={styles.sectionLabel}>Cities</Text>
            <View style={styles.chipRow}>
              {ALL_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, cities.includes(c) && styles.chipSelected]}
                  onPress={() => toggleArrayItem(c, cities, setCities)}
                >
                  <Text style={[styles.chipText, cities.includes(c) && styles.chipTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Specific Areas</Text>
            <View style={styles.chipRow}>
              {ALL_AREAS.slice(0, 20).map((a) => ( // limit UI for now
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, areas.includes(a) && styles.chipSelected]}
                  onPress={() => toggleArrayItem(a, areas, setAreas)}
                >
                  <Text style={[styles.chipText, areas.includes(a) && styles.chipTextSelected]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="step2" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepBody}>
            <Text style={styles.title}>What type of property?</Text>
            <Text style={styles.subtitle}>Select the types you are interested in.</Text>
            <View style={styles.chipRow}>
              {PROPERTY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, types.includes(t.value) && styles.chipSelected]}
                  onPress={() => toggleArrayItem(t.value, types, setTypes)}
                >
                  <Text style={[styles.chipText, types.includes(t.value) && styles.chipTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View key="step3" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepBody}>
            <Text style={styles.title}>How many bedrooms?</Text>
            <Text style={styles.subtitle}>What is the minimum number of bedrooms you need?</Text>
            <View style={styles.counterControls}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setBedrooms((b) => Math.max(1, b - 1))}
              >
                <Ionicons name="remove" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{bedrooms}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setBedrooms((b) => b + 1)}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View key="step4" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepBody}>
            <Text style={styles.title}>Must-have vs. Nice-to-have</Text>
            <Text style={styles.subtitle}>
              <Text style={{ fontWeight: 'bold' }}>Dealbreakers:</Text> If a property is missing any "Must-have", its score is heavily penalized.
            </Text>

            {AMENITY_OPTIONS.map((a) => (
              <View key={a} style={styles.amenityRow}>
                <Text style={styles.amenityName}>{a}</Text>
                <View style={styles.bucketControls}>
                  <TouchableOpacity
                    style={[
                      styles.bucketBtn,
                      reqAmenities.includes(a) && styles.bucketBtnReq,
                    ]}
                    onPress={() => toggleAmenity(a, 'REQUIRED')}
                  >
                    <Text style={[
                      styles.bucketText,
                      reqAmenities.includes(a) && styles.bucketTextActive
                    ]}>Must</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bucketBtn,
                      niceAmenities.includes(a) && styles.bucketBtnNice,
                    ]}
                    onPress={() => toggleAmenity(a, 'NICE')}
                  >
                    <Text style={[
                      styles.bucketText,
                      niceAmenities.includes(a) && styles.bucketTextActive
                    ]}>Nice</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.navBar}>
        <Button
          title={isLastStep ? 'Finish' : 'Next'}
          onPress={isLastStep ? handleSave : handleNext}
          isLoading={upsertMutation.isPending}
        />
      </View>
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
  topBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  skipBtn: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  // Budget Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.sm,
  },
  currencyLabel: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: typography.weights.medium,
  },
  // Counter
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  counterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  // Amenities list
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amenityName: {
    fontSize: typography.sizes.md,
    color: colors.text,
    textTransform: 'capitalize',
    flex: 1,
  },
  bucketControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bucketBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bucketBtnReq: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  bucketBtnNice: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bucketText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  bucketTextActive: {
    color: '#fff',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
