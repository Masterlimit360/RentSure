/**
 * API mode switch and Supabase client re-export for RentSure.
 *
 * This file is the single gateway that decides whether API calls hit
 * Supabase (live) or the in-memory mock layer (demo/QA). The decision
 * is driven by the EXPO_PUBLIC_USE_MOCKS env var:
 *
 *   false / unset  →  mock data (demo mode, default)
 *   true           →  live Supabase
 *
 * In live mode, NO axios client is used. All traffic flows through
 * supabase-js. The old axios interceptors and token management are
 * retained only as dead-code for reference; they are never reached
 * when USE_MOCKS is false.
 */

// ---------------------------------------------------------------------------
// Mock/Real switch — driven by env var, single source of truth
// ---------------------------------------------------------------------------

/**
 * When true, every *.api.ts file short-circuits to src/mocks/*.
 * When false, they call supabase-js (Postgres RPCs, Edge Functions, storage).
 *
 * DEFAULT is mock mode (demo). Set EXPO_PUBLIC_USE_MOCKS=true in .env
 * to switch to live Supabase.
 */
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS !== 'true';

/**
 * Returns true if the app is running in live Supabase mode.
 * Useful for UI guards (e.g. hiding "Reset Demo Data" in live mode).
 */
export const IS_LIVE = !USE_MOCKS;

