/**
 * Barrel re-export for all shared TypeScript types.
 *
 * Import from '@/types' anywhere in the app instead of reaching
 * into individual files — keeps imports tidy and lets us reorganise
 * the internals later without touching every consumer.
 */

export * from './entities';
export * from './api';
