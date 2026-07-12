/**
 * API request/response types for RentSure.
 *
 * Every endpoint wraps its payload in ApiResponse<T> — the frontend
 * never sees raw data. This file also defines all request DTOs and
 * the paginated list wrapper used by every "list" endpoint.
 */

import type {
  User,
  UserRole,
  PropertyType,
  BookingStatus,
  EscrowStatus,
  Rating,
  VerificationDocType,
  VerificationStatus,
} from './entities';

// ---------------------------------------------------------------------------
// Response envelope — every endpoint returns this shape
// ---------------------------------------------------------------------------

/**
 * Standard API response wrapper.
 *
 * IMPORTANT: All backend controllers MUST return this envelope.
 * The axios interceptor in client.ts unwraps `.data` for convenience,
 * but error handling relies on `.error.code` for machine-readable errors.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Auth DTOs
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Property DTOs
// ---------------------------------------------------------------------------

export interface PropertyFilters {
  query?: string;
  city?: string;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  propertyType: PropertyType;
  region: string;
  city: string;
  area: string;
  gpsLat?: number;
  gpsLng?: number;
  pricePerYear: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photoUris?: string[];
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {}

// ---------------------------------------------------------------------------
// Booking DTOs
// ---------------------------------------------------------------------------

export interface CreateBookingRequest {
  propertyId: string;
  moveInDate: string;
  durationMonths: number;
}

// ---------------------------------------------------------------------------
// Payment DTOs
// ---------------------------------------------------------------------------

/** Returned by POST /payments/initialize — tenant opens this URL to pay. */
export interface InitializePaymentResponse {
  checkoutUrl: string;
  paystackRef: string;
}

export interface PaymentStatusResponse {
  bookingId: string;
  amount: number;
  escrowStatus: EscrowStatus;
  paidAt: string;
  releasedAt?: string;
}

// ---------------------------------------------------------------------------
// Review DTOs
// ---------------------------------------------------------------------------

export interface CreateReviewRequest {
  bookingId: string;
  revieweeId: string;
  rating: Rating;
  comment: string;
}

// ---------------------------------------------------------------------------
// Verification DTOs
// ---------------------------------------------------------------------------

export interface SubmitVerificationRequest {
  docType: VerificationDocType;
  docUrl: string;
  propertyId?: string;
}

export interface AdminVerificationAction {
  status: VerificationStatus;
}

// ---------------------------------------------------------------------------
// Admin DTOs
// ---------------------------------------------------------------------------

export interface AdminUserFilters {
  role?: UserRole;
  status?: string;
  page?: number;
  size?: number;
}

/** Role of the signer — used by signAgreement so the mock knows which timestamp to set. */
export interface SignAgreementRequest {
  /** 'TENANT' or 'LANDLORD' — the backend extracts this from the JWT in production. */
  role: 'TENANT' | 'LANDLORD';
}

