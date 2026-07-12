import { supabase } from '@/api/supabase';
import { db } from '@/mocks/store';
import { simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import { USE_MOCKS } from './client';
import type { ApiResponse, TenantPreferences } from '@/types';

/**
 * Fetch tenant preferences.
 */
export async function getPreferences(userId: string): Promise<ApiResponse<TenantPreferences | null>> {
  if (USE_MOCKS) {
    await simulateLatency();
    const prefs = db.tenantPreferences.find(p => p.userId === userId) || null;
    return wrapResponse(prefs);
  }

  try {
    const { data, error } = await supabase
      .from('tenant_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) return wrapResponse(null);

    // Map snake_case to camelCase
    return wrapResponse({
      userId: data.user_id,
      budgetMaxPerYear: Number(data.budget_max_per_year),
      preferredCities: data.preferred_cities || [],
      preferredAreas: data.preferred_areas || [],
      propertyTypes: data.property_types || [],
      minBedrooms: data.min_bedrooms || 0,
      requiredAmenities: data.required_amenities || [],
      niceToHaveAmenities: data.nice_to_have_amenities || [],
      updatedAt: data.updated_at
    });
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    return wrapError('FETCH_FAILED', error.message);
  }
}

/**
 * Upsert tenant preferences.
 */
export async function upsertPreferences(prefs: TenantPreferences): Promise<ApiResponse<TenantPreferences>> {
  if (USE_MOCKS) {
    await simulateLatency();
    const index = db.tenantPreferences.findIndex(p => p.userId === prefs.userId);
    const updated = { ...prefs, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      db.tenantPreferences[index] = updated;
    } else {
      db.tenantPreferences.push(updated);
    }
    // We do not strictly need to flushDb here in mocks unless we want it to persist across reloads
    // But for consistency we should write to storage if we had a function for it.
    // For now, in-memory mutation is fine for tests.
    return wrapResponse(updated);
  }

  try {
    const payload = {
      user_id: prefs.userId,
      budget_max_per_year: prefs.budgetMaxPerYear,
      preferred_cities: prefs.preferredCities,
      preferred_areas: prefs.preferredAreas,
      property_types: prefs.propertyTypes,
      min_bedrooms: prefs.minBedrooms,
      required_amenities: prefs.requiredAmenities,
      nice_to_have_amenities: prefs.niceToHaveAmenities,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tenant_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) throw error;

    return wrapResponse({
      userId: data.user_id,
      budgetMaxPerYear: Number(data.budget_max_per_year),
      preferredCities: data.preferred_cities || [],
      preferredAreas: data.preferred_areas || [],
      propertyTypes: data.property_types || [],
      minBedrooms: data.min_bedrooms || 0,
      requiredAmenities: data.required_amenities || [],
      niceToHaveAmenities: data.nice_to_have_amenities || [],
      updatedAt: data.updated_at
    });
  } catch (error: any) {
    console.error('Error upserting preferences:', error);
    return wrapError('UPSERT_FAILED', error.message);
  }
}
