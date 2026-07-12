import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/api/supabase';
import { queryKeys as bookingKeys } from './useBookings';
import { queryKeys as notifKeys } from './useNotifications';

export const attentionKeys = {
  all: ['attention'] as const,
  tenant: (userId: string) => [...attentionKeys.all, 'tenant', userId] as const,
  landlord: (userId: string) => [...attentionKeys.all, 'landlord', userId] as const,
  admin: (userId: string) => [...attentionKeys.all, 'admin', userId] as const,
  notifications: (userId: string) => [...attentionKeys.all, 'notifications', userId] as const,
};

export function useAttentionCounts() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const role = user?.role;

  // 1. Unread Notifications Count
  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: attentionKeys.notifications(userId || ''),
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!userId,
  });

  // 2. Tenant Actionable Bookings
  // Actionable: ACCEPTED (needs pay), PAID_ESCROW unsigned (needs sign), PAID_ESCROW signed (needs move in), MOVED_IN (needs review)
  const { data: tenantActionableCount = 0 } = useQuery({
    queryKey: attentionKeys.tenant(userId || ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('status, tenant_signed_at, landlord_signed_at, id')
        .eq('tenant_id', userId)
        .in('status', ['ACCEPTED', 'PAID_ESCROW', 'MOVED_IN']);
      
      let count = 0;
      data?.forEach(b => {
        if (b.status === 'ACCEPTED') count++;
        if (b.status === 'PAID_ESCROW' && !b.tenant_signed_at) count++;
        if (b.status === 'PAID_ESCROW' && b.tenant_signed_at && b.landlord_signed_at) count++; // Can confirm move in
        // TODO: MOVED_IN unreviewed logic requires joining reviews, simplifying to just MOVED_IN for now
        if (b.status === 'MOVED_IN') count++; 
      });
      return count;
    },
    enabled: !!userId && role === 'TENANT',
  });

  // 3. Landlord Actionable Items
  // Actionable: REQUESTED bookings (needs accept/reject), PAID_ESCROW unsigned (needs sign)
  const { data: landlordActionableCount = 0 } = useQuery({
    queryKey: attentionKeys.landlord(userId || ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('status, landlord_signed_at, properties!inner(landlord_id)')
        .eq('properties.landlord_id', userId)
        .in('status', ['REQUESTED', 'PAID_ESCROW']);
      
      let count = 0;
      data?.forEach(b => {
        if (b.status === 'REQUESTED') count++;
        if (b.status === 'PAID_ESCROW' && !b.landlord_signed_at) count++;
      });
      return count;
    },
    enabled: !!userId && role === 'LANDLORD',
  });

  // 4. Admin Pending Verifications
  const { data: adminPendingCount = 0 } = useQuery({
    queryKey: attentionKeys.admin(userId || ''),
    queryFn: async () => {
      const { count } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');
      return count || 0;
    },
    enabled: !!userId && role === 'ADMIN',
  });

  return {
    unreadNotifications,
    tenantActionableCount,
    landlordActionableCount,
    adminPendingCount,
    totalTenant: unreadNotifications + tenantActionableCount,
    totalLandlord: unreadNotifications + landlordActionableCount,
    totalAdmin: unreadNotifications + adminPendingCount,
  };
}
