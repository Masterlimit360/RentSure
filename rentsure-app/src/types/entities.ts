/**
 * Domain entities for RentSure.
 *
 * These interfaces mirror the PostgreSQL schema 1-to-1 and form the
 * frozen API contract — both the React Native frontend and the future
 * Spring Boot backend must serialise/deserialise these exact shapes.
 * Changing a field here means changing the DB migration AND the DTO.
 */

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

/** Determines which tab group and permissions a user gets. */
export type UserRole = 'TENANT' | 'LANDLORD' | 'ADMIN';

/** Admin can suspend; only ACTIVE users can authenticate. */
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type PropertyType = 'SINGLE_ROOM' | 'SELF_CONTAINED' | 'APARTMENT' | 'HOUSE';

/** HIDDEN is a soft-delete; the property never re-appears in search. */
export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'HIDDEN';

export type MediaType = 'PHOTO' | 'VIDEO';

/**
 * IMPORTANT: Booking status transitions are enforced server-side via a
 * state machine (BookingService.transition()). The ONLY legal transitions are:
 *
 *   REQUESTED  → ACCEPTED | REJECTED
 *   ACCEPTED   → PAID_ESCROW | EXPIRED   (72 h auto-expiry keeps landlords
 *                                          from being held hostage by non-paying tenants)
 *   PAID_ESCROW → MOVED_IN
 *   MOVED_IN    → COMPLETED
 *
 * Any other transition throws INVALID_STATE (HTTP 409). Do not add
 * shortcuts — the escrow release depends on this exact ordering.
 */
export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'PAID_ESCROW'
  | 'MOVED_IN'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * HELD  → money in escrow, untouchable.
 * RELEASED → landlord received funds (triggered by tenant confirmMoveIn).
 * REFUNDED → tenant got money back (admin dispute resolution).
 */
export type EscrowStatus = 'PENDING_VERIFICATION' | 'HELD' | 'RELEASED' | 'REFUNDED';

export type VerificationDocType = 'GHANA_CARD' | 'LAND_TITLE' | 'UTILITY_BILL';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Verification {
  id: string;
  landlordId: string;
  propertyId?: string;
  docType: VerificationDocType;
  docUrl: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerifiedEmail: boolean;
  verificationStatus?: VerificationStatus; // Used by landlords to verify identity
  status: UserStatus;
  createdAt: string;
}

export interface TenantPreferences {
  userId: string;
  budgetMaxPerYear: number;
  preferredCities: string[];
  preferredAreas: string[];
  propertyTypes: PropertyType[];
  minBedrooms: number;
  requiredAmenities: string[];
  niceToHaveAmenities: string[];
  updatedAt: string;
}

export interface CompatibilityFactor {
  key: 'BUDGET' | 'LOCATION' | 'TYPE' | 'ROOMS' | 'AMENITIES';
  label: string;
  score: number;
  maxScore: number;
  detail: string;
}

export interface CompatibilityScore {
  total: number;
  factors: CompatibilityFactor[];
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  region: string;
  city: string;
  area: string;
  /** GPS coordinates are optional — not every listing has them. */
  gpsLat?: number;
  gpsLng?: number;
  /** Annual rent in GHS. */
  pricePerYear: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  /** True only after admin verifies landlord docs for this property. */
  isVerified: boolean;
  status: PropertyStatus;
  media: PropertyMedia[];
  createdAt: string;
}

export interface PropertyMedia {
  id: string;
  mediaType: MediaType;
  url: string;
  /** Controls the gallery carousel order; lower = shown first. */
  sortOrder: number;
}

export interface Booking {
  id: string;
  propertyId: string;
  tenantId: string;
  status: BookingStatus;
  requestedAt: string;
  moveInDate: string;
  durationMonths: number;
  /**
   * We snapshot the price at booking time so a landlord raising rent
   * later doesn't change an in-flight booking.
   */
  totalAmount: number;
  /** Human-readable ref like RS-8F3K2A, shown on receipts and in-app. */
  bookingRef: string;

  // Optional display fields populated by the backend to avoid N+1 queries on the frontend
  propertyTitle?: string;
  propertyImage?: string;
  tenantName?: string;
  tenantPhone?: string;
  landlordName?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  /** Paystack's unique transaction reference for idempotent webhook handling. */
  paystackRef: string;
  /** Paystack sends amounts in pesewas; this field is stored in GHS. */
  amount: number;
  fee: number;
  escrowStatus: EscrowStatus;
  paidAt: string;
  releasedAt?: string;
}

export interface Agreement {
  id: string;
  bookingId: string;
  pdfUrl: string;
  tenantSignedAt?: string;
  landlordSignedAt?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: Rating;
  comment: string;
  createdAt: string;
}


/**
 * In-app notification. Notifications are created server-side whenever
 * a booking status changes, a payment is received, or a review is left.
 * They are read-only from the client — only marking as read is permitted.
 */
export type NotificationType =
  | 'BOOKING_REQUESTED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'MOVE_IN_CONFIRMED'
  | 'REVIEW_RECEIVED'
  | 'AGREEMENT_SIGNED'
  | 'ESCROW_RELEASED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** bookingId links the notification to a specific booking for deep-linking. */
  bookingId?: string;
  isRead: boolean;
  createdAt: string;
}

