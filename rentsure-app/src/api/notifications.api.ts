import { USE_MOCKS } from './client';
import * as mocks from '@/mocks/notifications.mock';
import { supabase, mapSupabaseError } from './supabase';
import type { ApiResponse } from '@/types';
import type { Notification } from '@/types';

const ts = () => new Date().toISOString();

function mapToNotification(data: any): Notification {
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    title: data.title,
    body: data.body,
    isRead: data.is_read,
    createdAt: data.created_at,
  };
}

export async function listNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
  if (USE_MOCKS) return mocks.mockListNotifications(userId);
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: (data || []).map(mapToNotification), error: null, timestamp: ts() };
}

export async function markAllRead(userId: string): Promise<ApiResponse<{ updated: number }>> {
  if (USE_MOCKS) return mocks.mockMarkAllRead(userId);
  
  // Can only update own notifications per RLS
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
    .select('id');

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: { updated: data?.length || 0 }, error: null, timestamp: ts() };
}

export async function clearAllNotifications(userId: string): Promise<ApiResponse<{ cleared: number }>> {
  if (USE_MOCKS) return mocks.mockClearAllNotifications(userId);
  
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id');

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: { cleared: data?.length || 0 }, error: null, timestamp: ts() };
}

export async function deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
  if (USE_MOCKS) return mocks.mockDeleteNotification(notificationId);
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    return { success: false, data: null, error: mapSupabaseError(error), timestamp: ts() };
  }

  return { success: true, data: null as any, error: null, timestamp: ts() };
}
