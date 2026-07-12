/**
 * Axios HTTP client and mock/real API switch for RentSure.
 *
 * This file is the single gateway for all API traffic. It configures
 * the base URL, attaches JWT tokens via interceptors, and handles
 * silent token refresh on 401 responses.
 *
 * IMPORTANT: The USE_MOCKS flag below controls whether the app hits
 * the real Spring Boot backend or uses the in-memory mock layer.
 * Every feature API file (auth.api.ts, properties.api.ts, etc.) reads
 * this flag to decide which implementation to export. Flip it to false
 * ONLY when the real backend is running and reachable.
 */

import axios from 'axios';

// ---------------------------------------------------------------------------
// Mock/Real switch
// ---------------------------------------------------------------------------

/**
 * IMPORTANT: Set to `false` when the real Spring Boot backend is deployed
 * and ready. While `true`, all API calls go through src/mocks/ instead
 * of making HTTP requests. This is the ONLY place this decision is made —
 * individual API files import this flag and branch accordingly.
 */
export const USE_MOCKS = true;

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

/**
 * Pre-configured axios instance pointing at the REST API.
 * All real (non-mock) API calls should use this instance, never bare `axios`.
 */
export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Auth token management — used by interceptors below
// ---------------------------------------------------------------------------

/** In-memory token cache; also persisted to expo-secure-store by the auth store. */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT to every outgoing request
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — silent token refresh on 401
// ---------------------------------------------------------------------------

/**
 * IMPORTANT: This interceptor implements silent token refresh. When a
 * request fails with 401, it attempts ONE refresh using the stored
 * refresh token. If the refresh also fails, the user is logged out.
 * Do not add retry loops here — a single refresh attempt is sufficient
 * and prevents infinite loops if both tokens are expired.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    /* Only attempt refresh once per request (prevents infinite loop) */
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshToken
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccess, refreshToken: newRefresh } =
          response.data.data;

        setTokens(newAccess, newRefresh);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return apiClient(originalRequest);
      } catch {
        /* Refresh failed — force logout. The auth store listens for this. */
        clearTokens();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
