import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Maps a Supabase/PostgREST error to our standard ApiResponse error format.
 * - RLS denials → FORBIDDEN
 * - Trigger rejections (RAISE EXCEPTION) → INVALID_STATE
 * - PostgREST not found (PGRST116) → NOT_FOUND
 * - Default → UNKNOWN_ERROR
 */
export function mapSupabaseError(error: any): { code: string; message: string } {
  if (!error) return { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };

  console.error('[Supabase Error]', JSON.stringify(error, null, 2));

  let message = 'Unknown error occurred';
  if (typeof error === 'string') {
    message = error;
  } else if (typeof error.message === 'string') {
    message = error.message;
  } else if (typeof error.details === 'string') {
    message = error.details;
  }

  const code = error.code || error.status?.toString() || '';

  // Auth specific errors
  if (code === 'unexpected_failure' || code === '500') {
    return { code: 'UNEXPECTED_FAILURE', message: 'Something went wrong on our end. Please try again.' };
  }
  
  if (message.toLowerCase().includes('invalid login credentials') || code === 'invalid_grant' || message.toLowerCase().includes('incorrect email or password')) {
    return { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' };
  }
  
  if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('network request failed')) {
    return { code: 'NETWORK_ERROR', message: 'No connection. Check your internet and try again.' };
  }

  // PostgREST "not found" when using .single()
  if (code === 'PGRST116') {
    return { code: 'NOT_FOUND', message: 'Resource not found' };
  }

  // Row Level Security denial
  if (code === '42501') {
    return { code: 'FORBIDDEN', message: 'Access denied (RLS)' };
  }

  // Trigger rejections (custom exceptions)
  if (code === 'P0001' || message.includes('Illegal transition') || message.includes('Unauthorized')) {
    return { code: 'INVALID_STATE', message };
  }

  return { code: 'DB_ERROR', message };
}
