/**
 * Mock admin endpoints.
 *
 * Provides user listing (with filters + pagination) and user suspension.
 * These are admin-only operations — the real backend enforces this via
 * @PreAuthorize("hasRole('ADMIN')").
 */

import { db, requireAuth, withWriteLock } from './store';
import { simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import type {
  ApiResponse,
  PaginatedResponse,
  AdminUserFilters,
} from '@/types';
import type { User } from '@/types';

/**
 * List all users with optional role/status filters and pagination.
 */
export async function mockListUsers(
  filters: AdminUserFilters
): Promise<ApiResponse<PaginatedResponse<User>>> {
  await simulateLatency();

  const user = requireAuth();
  if (!user || user.role !== 'ADMIN') {
    return wrapError('UNAUTHORIZED', 'Only admins can list users');
  }

  let results = [...db.users];

  if (filters.role) {
    results = results.filter((u) => u.role === filters.role);
  }

  if (filters.status) {
    results = results.filter((u) => u.status === filters.status);
  }

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
 * Suspend a user account.
 */
export async function mockSuspendUser(
  userId: string
): Promise<ApiResponse<User>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const currentUser = requireAuth();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return wrapError('UNAUTHORIZED', 'Only admins can suspend users');
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return wrapError('USER_NOT_FOUND', 'User not found');
    }

    if (user.role === 'ADMIN') {
      return wrapError('CANNOT_SUSPEND_ADMIN', 'Admin accounts cannot be suspended');
    }

    user.status = 'SUSPENDED';
    await import('./store').then(m => m.flushDb());
    return wrapResponse(user);
  });
}

/**
 * Reactivate a suspended user account.
 */
export async function mockReactivateUser(
  userId: string
): Promise<ApiResponse<User>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const currentUser = requireAuth();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return wrapError('UNAUTHORIZED', 'Only admins can reactivate users');
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return wrapError('USER_NOT_FOUND', 'User not found');
    }

    user.status = 'ACTIVE';
    await import('./store').then(m => m.flushDb());
    return wrapResponse(user);
  });
}
