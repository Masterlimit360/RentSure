/**
 * Properties hooks.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  softDeleteProperty,
  hardDeleteProperty,
} from '@/api/properties.api';
import type { PropertyFilters, CreatePropertyRequest, UpdatePropertyRequest } from '@/types';

export const queryKeys = {
  properties: ['properties'] as const,
  propertyList: (filters: PropertyFilters) => ['properties', 'list', filters] as const,
  propertyDetail: (id: string) => ['properties', 'detail', id] as const,
};

/**
 * Fetches an infinite scrolling list of properties.
 *
 * Automatically manages the `page` parameter internally.
 * 
 * @param filters Optional search/filter criteria.
 */
export function useInfiniteProperties(filters: Omit<PropertyFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.propertyList(filters),
    queryFn: ({ pageParam = 0 }) => listProperties({ ...filters, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      // Backend paginated responses return `page` (current 0-indexed page) and `totalPages`
      const nextPage = lastPage.data?.page !== undefined ? lastPage.data.page + 1 : undefined;
      return nextPage && lastPage.data?.totalPages && nextPage < lastPage.data.totalPages 
        ? nextPage 
        : undefined;
    },
  });
}

export function useProperties(filters: PropertyFilters) {
  return useQuery({
    queryKey: queryKeys.propertyList(filters),
    queryFn: () => listProperties(filters),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: queryKeys.propertyDetail(id),
    queryFn: () => getPropertyById(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ landlordId, req }: { landlordId: string; req: CreatePropertyRequest }) =>
      createProperty(landlordId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ landlordId, propertyId, req }: { landlordId: string; propertyId: string; req: UpdatePropertyRequest }) =>
      updateProperty(landlordId, propertyId, req),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      queryClient.invalidateQueries({ queryKey: queryKeys.propertyDetail(variables.propertyId) });
    },
  });
}

export function useSoftDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ landlordId, propertyId }: { landlordId: string; propertyId: string }) =>
      softDeleteProperty(landlordId, propertyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      queryClient.invalidateQueries({ queryKey: queryKeys.propertyDetail(variables.propertyId) });
    },
  });
}

export function useHardDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ landlordId, propertyId }: { landlordId: string; propertyId: string }) =>
      hardDeleteProperty(landlordId, propertyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      queryClient.invalidateQueries({ queryKey: queryKeys.propertyDetail(variables.propertyId) });
    },
  });
}
