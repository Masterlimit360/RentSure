/**
 * Mock property endpoints.
 *
 * Handles listing (with filters + pagination), single-property lookup,
 * CRUD for landlords, and media upload. Search filtering mirrors the
 * PostgreSQL index on (city, property_type, price_per_year).
 */

import { db, flushDb, requireAuth, withWriteLock } from './store';
import { generateId, simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import { copyImageToDocumentStorage } from './persistence/fileStore';
import type {
  ApiResponse,
  PaginatedResponse,
  PropertyFilters,
  CreatePropertyRequest,
  UpdatePropertyRequest,
} from '@/types';
import type { Property, PropertyMedia } from '@/types';

/**
 * List properties with optional filters and pagination.
 */
export async function mockListProperties(
  filters: PropertyFilters
): Promise<ApiResponse<PaginatedResponse<Property>>> {
  await simulateLatency({ canFail: true });

  const user = requireAuth();
  if (!user) return wrapError('UNAUTHORIZED', 'Not authorized');

  // Landlords see ALL of their own properties (any status).
  // Tenants/everyone else see only AVAILABLE properties from all landlords.
  let results: Property[];
  if (user.role === 'LANDLORD') {
    results = db.properties.filter(
      (p) => p.landlordId === user.id || p.status === 'AVAILABLE'
    );
  } else {
    results = db.properties.filter((p) => p.status === 'AVAILABLE');
  }

  if (filters.query) {
    const qLower = filters.query.toLowerCase();
    results = results.filter(
      (p) =>
        p.city.toLowerCase().includes(qLower) ||
        p.title.toLowerCase().includes(qLower) ||
        p.area.toLowerCase().includes(qLower)
    );
  }

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    results = results.filter((p) => p.city.toLowerCase() === cityLower);
  }

  if (filters.type) {
    results = results.filter((p) => p.propertyType === filters.type);
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((p) => p.pricePerYear >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    results = results.filter((p) => p.pricePerYear <= filters.maxPrice!);
  }

  /* Pagination — clamp size between 1 and 50 */
  const page = Math.max(0, filters.page ?? 0);
  const size = Math.min(50, Math.max(1, filters.size ?? 20));
  const totalElements = results.length;
  const totalPages = Math.ceil(totalElements / size);
  const start = page * size;
  const content = results.slice(start, start + size);

  return wrapResponse({
    content,
    page,
    size,
    totalElements,
    totalPages,
  });
}

/**
 * Get a single property by ID.
 */
export async function mockGetPropertyById(
  id: string
): Promise<ApiResponse<Property>> {
  await simulateLatency();

  const user = requireAuth();
  if (!user) return wrapError('UNAUTHORIZED', 'Not authorized');

  const property = db.properties.find((p) => p.id === id);
  if (!property) {
    return wrapError('PROPERTY_NOT_FOUND', 'Property not found');
  }

  return wrapResponse(property);
}

/**
 * Create a new property listing.
 */
export async function mockCreateProperty(
  landlordId: string,
  req: CreatePropertyRequest
): Promise<ApiResponse<Property>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.id !== landlordId || user.role !== 'LANDLORD') {
      return wrapError('UNAUTHORIZED', 'Not authorized to create property');
    }

    const media: PropertyMedia[] = [];

    if (req.photoUris && req.photoUris.length > 0) {
      let sortOrder = 1;
      for (const uri of req.photoUris) {
        let finalUri = uri;
        if (uri.startsWith('file://')) {
          const extension = uri.split('.').pop() || 'jpg';
          const newFilename = `prop_${generateId()}.${extension}`;
          finalUri = await copyImageToDocumentStorage(uri, newFilename);
        }
        media.push({
          id: generateId(),
          mediaType: 'PHOTO',
          url: finalUri,
          sortOrder: sortOrder++,
        });
      }
    }

    const newProperty: Property = {
      id: generateId(),
      landlordId,
      ...req,
      isVerified: false,
      status: 'AVAILABLE',
      media,
      createdAt: new Date().toISOString(),
    };

    db.properties.push(newProperty);
    await flushDb();
    return wrapResponse(newProperty);
  });
}

/**
 * Update an existing property.
 */
export async function mockUpdateProperty(
  landlordId: string,
  propertyId: string,
  req: UpdatePropertyRequest
): Promise<ApiResponse<Property>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.id !== landlordId || user.role !== 'LANDLORD') {
      return wrapError('UNAUTHORIZED', 'Not authorized');
    }

    const property = db.properties.find((p) => p.id === propertyId);
    if (!property) {
      return wrapError('PROPERTY_NOT_FOUND', 'Property not found');
    }

    if (property.landlordId !== landlordId) {
      return wrapError('FORBIDDEN', 'You can only edit your own properties');
    }

    if (req.photoUris) {
      const media: import('@/types').PropertyMedia[] = [];
      let sortOrder = 1;
      for (const uri of req.photoUris) {
        let finalUri = uri;
        if (uri.startsWith('file://')) {
          const extension = uri.split('.').pop() || 'jpg';
          const newFilename = `prop_${generateId()}.${extension}`;
          finalUri = await copyImageToDocumentStorage(uri, newFilename);
        }
        media.push({
          id: generateId(),
          mediaType: 'PHOTO',
          url: finalUri,
          sortOrder: sortOrder++,
        });
      }
      property.media = media;
    }

    const { photoUris, ...restReq } = req as any;
    Object.assign(property, restReq);
    
    await flushDb();
    return wrapResponse(property);
  });
}

/**
 * Soft-delete a property.
 */
export async function mockSoftDeleteProperty(
  landlordId: string,
  propertyId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.id !== landlordId || user.role !== 'LANDLORD') {
      return wrapError('UNAUTHORIZED', 'Not authorized');
    }

    const property = db.properties.find((p) => p.id === propertyId);
    if (!property) {
      return wrapError('PROPERTY_NOT_FOUND', 'Property not found');
    }

    if (property.landlordId !== landlordId) {
      return wrapError('FORBIDDEN', 'You can only delete your own properties');
    }

    property.status = 'HIDDEN';
    await flushDb();
    return wrapResponse({ deleted: true });
  });
}

/**
 * Hard-delete a property.
 */
export async function mockHardDeleteProperty(
  landlordId: string,
  propertyId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.id !== landlordId || user.role !== 'LANDLORD') {
      return wrapError('UNAUTHORIZED', 'Not authorized');
    }

    const propertyIndex = db.properties.findIndex((p) => p.id === propertyId);
    if (propertyIndex === -1) {
      return wrapError('PROPERTY_NOT_FOUND', 'Property not found');
    }

    if (db.properties[propertyIndex].landlordId !== landlordId) {
      return wrapError('FORBIDDEN', 'You can only delete your own properties');
    }

    db.properties.splice(propertyIndex, 1);
    await flushDb();
    return wrapResponse({ deleted: true });
  });
}

/**
 * Upload media (photo/video) to a property.
 */
export async function mockUploadMedia(
  propertyId: string,
  mediaType: 'PHOTO' | 'VIDEO'
): Promise<ApiResponse<PropertyMedia>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'LANDLORD') {
      return wrapError('UNAUTHORIZED', 'Not authorized');
    }

    const property = db.properties.find((p) => p.id === propertyId);
    if (!property) {
      return wrapError('PROPERTY_NOT_FOUND', 'Property not found');
    }

    if (property.landlordId !== user.id) {
      return wrapError('FORBIDDEN', 'You can only edit your own properties');
    }

    const newMedia: PropertyMedia = {
      id: generateId(),
      mediaType,
      url: `https://picsum.photos/seed/${generateId()}/800/600`,
      sortOrder: property.media.length + 1,
    };

    property.media.push(newMedia);
    await flushDb();
    return wrapResponse(newMedia);
  });
}
