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
 * Maps ANY Supabase/PostgREST/GoTrue error into { code, message }.
 *
 * Rules:
 * - NEVER log or render the raw error object (may contain headers/cookies).
 * - NEVER surface internal messages to the user.
 * - ALL paths return a safe, user-readable string in `message`.
 *
 * Auth class errors  → SERVER_ERROR or INVALID_CREDENTIALS or NETWORK_ERROR
 * RLS denials        → FORBIDDEN
 * Trigger RAISE      → INVALID_STATE
 * Not found          → NOT_FOUND
 * Default            → SERVER_ERROR
 */
export function mapSupabaseError(error: any): { code: string; message: string } {
  if (!error) return { code: 'UNKNOWN_ERROR', message: 'Something went wrong. Please try again.' };

  // Extract a safe technical string for logging only (no objects, no headers)
  let techDetail = '';
  try {
    if (typeof error === 'string') {
      techDetail = error;
    } else {
      techDetail = [error.name, error.code, error.status, error.message]
        .filter(Boolean)
        .join(' | ');
    }
  } catch {
    techDetail = 'non-serializable error';
  }

  // Log ONLY the sanitised string — never the raw object
  console.error('[Supabase Error]', techDetail);

  // Pull fields safely
  const errorName: string = error?.name ?? '';
  const errorCode: string = String(error?.code ?? error?.status ?? '');
  const errorMsg: string  = String(error?.message ?? error?.details ?? '');
  const lowerMsg = errorMsg.toLowerCase();

  // ── GoTrue network / retryable errors ──────────────────────────────────
  // AuthRetryableFetchError is thrown when the fetch itself fails (no network,
  // or the server returns 5xx). Crucially, these carry no useful user message.
  if (
    errorName === 'AuthRetryableFetchError' ||
    errorName === 'AuthApiError' && (errorCode === '500' || errorCode === 'unexpected_failure') ||
    errorCode === '500' ||
    errorCode === 'unexpected_failure'
  ) {
    return { code: 'SERVER_ERROR', message: 'Something went wrong on our end. Please try again.' };
  }

  // ── Invalid credentials ─────────────────────────────────────────────────
  if (
    lowerMsg.includes('invalid login credentials') ||
    errorCode === 'invalid_grant' ||
    errorCode === '400'
  ) {
    return { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' };
  }

  // ── Network / offline ───────────────────────────────────────────────────
  if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('network request failed')) {
    return { code: 'NETWORK_ERROR', message: 'No connection. Check your internet and try again.' };
  }

  // ── PostgREST not found ─────────────────────────────────────────────────
  if (errorCode === 'PGRST116') {
    return { code: 'NOT_FOUND', message: 'Resource not found.' };
  }

  // ── RLS denial ──────────────────────────────────────────────────────────
  if (errorCode === '42501') {
    return { code: 'FORBIDDEN', message: 'You do not have permission to do that.' };
  }

  // ── Trigger / state machine rejection ───────────────────────────────────
  if (
    errorCode === 'P0001' ||
    lowerMsg.includes('illegal transition') ||
    lowerMsg.includes('unauthorized')
  ) {
    // Surface trigger message for state errors (it's our own copy)
    return { code: 'INVALID_STATE', message: errorMsg || 'Action not allowed in current state.' };
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  return { code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' };
}
