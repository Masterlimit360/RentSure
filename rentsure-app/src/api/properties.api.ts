import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/properties.mock';
import { supabase, mapSupabaseError } from './supabase';
import type {
  ApiResponse,
  PaginatedResponse,
  PropertyFilters,
  CreatePropertyRequest,
  UpdatePropertyRequest,
} from '@/types';
import type { Property, PropertyMedia } from '@/types';

const ts = () => new Date().toISOString();

// Helper to map DB row to our UI Property model
function mapToProperty(row: any): Property {
  return {
    id: row.id,
    landlordId: row.landlord_id,
    title: row.title,
    description: row.description,
    propertyType: row.property_type,
    region: row.region,
    city: row.city,
    area: row.area,
    gpsLat: row.gps_lat || undefined,
    gpsLng: row.gps_lng || undefined,
    pricePerYear: row.price_per_year,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    amenities: row.amenities || [],
    isVerified: row.is_verified,
    status: row.status,
    media: (row.property_media || []).map((m: any) => ({
      id: m.id,
      mediaType: m.media_type,
      url: m.url,
      sortOrder: m.sort_order,
    })),
    createdAt: row.created_at,
  };
}

export async function listProperties(
  filters: PropertyFilters
): Promise<ApiResponse<PaginatedResponse<Property>>> {
  if (USE_MOCKS) return mocks.mockListProperties(filters);
  
  let query = supabase.from('properties').select('*, property_media(*)', { count: 'exact' });

  // Apply filters — field names match the PropertyFilters contract
  if (filters.query) {
    query = query.or(`title.ilike.%${filters.query}%,city.ilike.%${filters.query}%`);
  }
  if (filters.city) query = query.eq('city', filters.city);
  if (filters.type) query = query.eq('property_type', filters.type);
  if (filters.minPrice) query = query.gte('price_per_year', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price_per_year', filters.maxPrice);

  const page = filters.page || 0;
  const size = filters.size || 20;
  const from = page * size;
  const to = from + size - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return {
    success: true,
    data: {
      content: (data || []).map(mapToProperty),
      totalElements: count || 0,
      totalPages: Math.ceil((count || 0) / size),
      page: page,
      size: size,
    },
    error: null,
    timestamp: ts(),
  };
}

export async function getPropertyById(
  id: string
): Promise<ApiResponse<Property>> {
  if (USE_MOCKS) return mocks.mockGetPropertyById(id);
  
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_media(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return { success: false, data: null, error: error ? mapSupabaseError(error) : { code: 'NOT_FOUND', message: 'Property not found' }, timestamp: ts() };
  }

  return { success: true, data: mapToProperty(data), error: null, timestamp: ts() };
}

export async function createProperty(
  landlordId: string,
  req: CreatePropertyRequest
): Promise<ApiResponse<Property>> {
  if (USE_MOCKS) return mocks.mockCreateProperty(landlordId, req);
  
  const { data, error } = await supabase.from('properties').insert({
    landlord_id: landlordId,
    title: req.title,
    description: req.description,
    property_type: req.propertyType,
    region: req.region,
    city: req.city,
    area: req.area,
    gps_lat: req.gpsLat,
    gps_lng: req.gpsLng,
    price_per_year: req.pricePerYear,
    bedrooms: req.bedrooms,
    bathrooms: req.bathrooms,
    amenities: req.amenities,
    status: 'AVAILABLE'
  }).select('*, property_media(*)').single();

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToProperty(data), error: null, timestamp: ts() };
}

export async function updateProperty(
  landlordId: string,
  propertyId: string,
  req: UpdatePropertyRequest
): Promise<ApiResponse<Property>> {
  if (USE_MOCKS) return mocks.mockUpdateProperty(landlordId, propertyId, req);
  
  const updateData: any = {};
  if (req.title) updateData.title = req.title;
  if (req.description) updateData.description = req.description;
  if (req.pricePerYear) updateData.price_per_year = req.pricePerYear;

  const { data, error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', propertyId)
    .select('*, property_media(*)')
    .single();

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: mapToProperty(data), error: null, timestamp: ts() };
}

export async function softDeleteProperty(
  landlordId: string,
  propertyId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  if (USE_MOCKS) return mocks.mockSoftDeleteProperty(landlordId, propertyId);
  
  const { error } = await supabase
    .from('properties')
    .update({ status: 'HIDDEN' })
    .eq('id', propertyId);

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: { deleted: true }, error: null, timestamp: ts() };
}

export async function hardDeleteProperty(
  landlordId: string,
  propertyId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  if (USE_MOCKS) return mocks.mockHardDeleteProperty(landlordId, propertyId);
  
  const { error } = await supabase.from('properties').delete().eq('id', propertyId);

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }
  return { success: true, data: { deleted: true }, error: null, timestamp: ts() };
}

export async function uploadMedia(
  propertyId: string,
  mediaType: 'PHOTO' | 'VIDEO'
): Promise<ApiResponse<PropertyMedia>> {
  if (USE_MOCKS) return mocks.mockUploadMedia(propertyId, mediaType);
  
  const randomUrl = `https://nxujvinvafvfsavdlqwj.supabase.co/storage/v1/object/public/property-media/dummy-${Date.now()}.jpg`;
  
  const { data, error } = await supabase.from('property_media').insert({
    property_id: propertyId,
    media_type: mediaType,
    url: randomUrl,
    sort_order: 0
  }).select().single();

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return {
    success: true,
    data: {
      id: data.id,
      mediaType: data.media_type,
      url: data.url,
      sortOrder: data.sort_order,
    },
    error: null,
    timestamp: ts(),
  };
}
