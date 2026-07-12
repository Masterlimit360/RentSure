/**
 * Authentication API endpoints.
 *
 * Uses the USE_MOCKS flag from client.ts to branch between the real
 * axios implementation and the local in-memory mocks.
 */

import { apiClient, USE_MOCKS } from './client';
import * as mocks from '@/mocks/auth.mock';
import type {
  ApiResponse,
  TokenResponse,
  RegisterRequest,
  VerifyEmailRequest,
  LoginRequest,
  RefreshRequest,
} from '@/types';
import type { User } from '@/types';

/**
 * Register a new user account.
 * Real backend: POST /auth/register
 */
export async function register(
  req: RegisterRequest
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockRegister(req);
  const response = await apiClient.post<ApiResponse<User>>('/auth/register', req);
  return response.data;
}

/**
 * Verify a user's email address via OTP.
 * Real backend: POST /auth/verify-email
 */
export async function verifyEmail(
  req: VerifyEmailRequest
): Promise<ApiResponse<{ verified: boolean }>> {
  if (USE_MOCKS) return mocks.mockVerifyEmail(req);
  const response = await apiClient.post<ApiResponse<{ verified: boolean }>>(
    '/auth/verify-email',
    req
  );
  return response.data;
}

/**
 * Authenticate a user and get JWTs.
 * Real backend: POST /auth/login
 */
export async function login(
  req: LoginRequest
): Promise<ApiResponse<TokenResponse>> {
  if (USE_MOCKS) return mocks.mockLogin(req);
  const response = await apiClient.post<ApiResponse<TokenResponse>>('/auth/login', req);
  return response.data;
}

/**
 * Refresh expired access token.
 * Real backend: POST /auth/refresh
 */
export async function refresh(
  req: RefreshRequest
): Promise<ApiResponse<TokenResponse>> {
  if (USE_MOCKS) return mocks.mockRefresh(req);
  const response = await apiClient.post<ApiResponse<TokenResponse>>('/auth/refresh', req);
  return response.data;
}

/**
 * Logout (invalidate refresh token).
 * Real backend: POST /auth/logout
 */
export async function logout(
  refreshToken: string
): Promise<ApiResponse<{ loggedOut: boolean }>> {
  if (USE_MOCKS) return mocks.mockLogout(refreshToken);
  const response = await apiClient.post<ApiResponse<{ loggedOut: boolean }>>(
    '/auth/logout',
    { refreshToken }
  );
  return response.data;
}

export async function updateProfile(
  userId: string,
  data: { fullName: string; phone: string }
): Promise<ApiResponse<User>> {
  if (USE_MOCKS) return mocks.mockUpdateProfile(userId, data);
  const response = await apiClient.put<ApiResponse<User>>(`/users/${userId}`, data);
  return response.data;
}


