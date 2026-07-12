/**
 * Mock authentication endpoints.
 *
 * Simulates register, login, email verification, token refresh, and
 * logout against the in-memory store. Password comparison is plain-text
 * (the real backend uses BCrypt). Token generation uses random strings
 * instead of JWTs — only the shape of the response matters for the UI.
 */

import { db, refreshTokens, flushDb } from './store';
import { generateId, simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import type { ApiResponse, TokenResponse, RegisterRequest, LoginRequest, RefreshRequest, VerifyEmailRequest } from '@/types';
import type { User } from '@/types';

/**
 * Register a new user account.
 * Precondition: email must not already exist in the system.
 * @throws EMAIL_EXISTS if the email is already registered.
 */
export async function mockRegister(
  req: RegisterRequest
): Promise<ApiResponse<User>> {
  await simulateLatency();

  const existingEmail = db.users.find((u) => u.email === req.email);
  if (existingEmail) {
    return wrapError('EMAIL_EXISTS', 'An account with this email already exists');
  }

  const existingPhone = db.users.find((u) => u.phone === req.phone);
  if (existingPhone) {
    return wrapError('PHONE_EXISTS', 'An account with this phone number already exists');
  }

  const newUser: User = {
    id: generateId(),
    fullName: req.fullName,
    email: req.email,
    phone: req.phone,
    role: req.role,
    isVerifiedEmail: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.passwords[newUser.id] = req.password;
  await flushDb();

  return wrapResponse(newUser);
}

/**
 * Verify a user's email address via OTP.
 * In mocks, any 6-digit OTP is accepted — we're testing the flow, not SMS delivery.
 */
export async function mockVerifyEmail(
  req: VerifyEmailRequest
): Promise<ApiResponse<{ verified: boolean }>> {
  await simulateLatency();

  const user = db.users.find((u) => u.email === req.email);
  if (!user) {
    return wrapError('USER_NOT_FOUND', 'No account found with this email');
  }

  /* Accept any 6-digit OTP in mocks for ease of testing */
  if (req.otp.length !== 6) {
    return wrapError('INVALID_OTP', 'OTP must be 6 digits');
  }

  user.isVerifiedEmail = true;
  await flushDb();
  return wrapResponse({ verified: true });
}

/**
 * Authenticate a user and return JWT tokens + user profile.
 * Precondition: user must exist and be ACTIVE.
 * @throws INVALID_CREDENTIALS for wrong email or password.
 * @throws ACCOUNT_SUSPENDED if the admin has suspended this user.
 */
export async function mockLogin(
  req: LoginRequest
): Promise<ApiResponse<TokenResponse>> {
  await simulateLatency();

  const user = db.users.find((u) => u.email === req.email);
  if (!user) {
    return wrapError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const storedPassword = db.passwords[user.id];
  if (storedPassword !== req.password) {
    return wrapError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.status === 'SUSPENDED') {
    return wrapError('ACCOUNT_SUSPENDED', 'Your account has been suspended. Contact support.');
  }

  /* Generate opaque tokens — the real backend uses signed JWTs */
  const accessToken = `mock-access-${user.id}-${Date.now()}`;
  const refreshToken = `mock-refresh-${user.id}-${Date.now()}`;

  refreshTokens[refreshToken] = user.id;

  return wrapResponse({
    accessToken,
    refreshToken,
    user,
  });
}

/**
 * Exchange a valid refresh token for a new access token.
 * @throws INVALID_TOKEN if the refresh token is expired or unknown.
 */
export async function mockRefresh(
  req: RefreshRequest
): Promise<ApiResponse<TokenResponse>> {
  await simulateLatency();

  const userId = refreshTokens[req.refreshToken];
  if (!userId) {
    return wrapError('INVALID_TOKEN', 'Refresh token is invalid or expired');
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return wrapError('INVALID_TOKEN', 'User no longer exists');
  }

  /* Rotate the refresh token — old one is invalidated */
  delete refreshTokens[req.refreshToken];
  const newAccessToken = `mock-access-${user.id}-${Date.now()}`;
  const newRefreshToken = `mock-refresh-${user.id}-${Date.now()}`;
  refreshTokens[newRefreshToken] = user.id;

  return wrapResponse({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user,
  });
}

/**
 * Invalidate the current refresh token (sign out).
 * Always succeeds — even if the token is already gone.
 */
export async function mockLogout(refreshToken: string): Promise<ApiResponse<{ loggedOut: boolean }>> {
  await simulateLatency();
  delete refreshTokens[refreshToken];
  return wrapResponse({ loggedOut: true });
}

export async function mockUpdateProfile(userId: string, data: { fullName: string; phone: string }): Promise<ApiResponse<User>> {
  await simulateLatency();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return wrapError('NOT_FOUND', 'User not found');
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    fullName: data.fullName,
    phone: data.phone,
  };
  await flushDb();
  
  return wrapResponse(db.users[userIndex]);
}


