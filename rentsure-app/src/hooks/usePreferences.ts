import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPreferences, upsertPreferences } from '@/api/preferences.api';
import type { TenantPreferences } from '@/types';

export const PREFERENCES_QUERY_KEY = 'preferences';

export function usePreferences(userId?: string) {
  return useQuery({
    queryKey: [PREFERENCES_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await getPreferences(userId);
      if (!res.success) throw new Error(res.error?.message || 'Failed to fetch preferences');
      return res.data;
    },
    enabled: !!userId,
  });
}

export function useUpsertPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: TenantPreferences) => {
      const res = await upsertPreferences(prefs);
      if (!res.success) throw new Error(res.error?.message || 'Failed to save preferences');
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.userId) {
        queryClient.invalidateQueries({ queryKey: [PREFERENCES_QUERY_KEY, data.userId] });
      }
    },
  });
}
