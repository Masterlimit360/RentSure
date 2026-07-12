/**
 * Mock review endpoints.
 *
 * Reviews are only allowed after a booking reaches MOVED_IN or COMPLETED
 * status — this is RentSure's anti-fake-review mechanism. Each party
 * (tenant and landlord) can leave exactly one review per booking.
 */

import { db, flushDb, requireAuth, withWriteLock } from './store';
import { generateId, simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import type { ApiResponse, CreateReviewRequest } from '@/types';
import type { Review } from '@/types';

/**
 * Create a review for a completed booking.
 */
export async function mockCreateReview(
  reviewerId: string,
  req: CreateReviewRequest
): Promise<ApiResponse<Review>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.id !== reviewerId) {
      return wrapError('UNAUTHORIZED', 'Not authorized');
    }

    const booking = db.bookings.find((b) => b.id === req.bookingId);
    if (!booking) {
      return wrapError('BOOKING_NOT_FOUND', 'Booking not found');
    }

    const reviewableStatuses = ['MOVED_IN', 'COMPLETED'];
    if (!reviewableStatuses.includes(booking.status)) {
      return wrapError(
        'INVALID_STATE',
        'Reviews can only be left for bookings in MOVED_IN or COMPLETED state'
      );
    }

    const existingReview = db.reviews.find(
      (r) => r.bookingId === req.bookingId && r.reviewerId === reviewerId
    );
    if (existingReview) {
      return wrapError('DUPLICATE_REVIEW', 'You have already reviewed this booking');
    }

    const newReview: Review = {
      id: generateId(),
      bookingId: req.bookingId,
      reviewerId,
      revieweeId: req.revieweeId,
      rating: req.rating,
      comment: req.comment,
      createdAt: new Date().toISOString(),
    };

    db.reviews.push(newReview);

    // Cross-Account Notification
    db.notifications.push({
      id: generateId(),
      userId: req.revieweeId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review',
      body: `You received a ${req.rating}-star review.`,
      bookingId: booking.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Transition booking to COMPLETED after review
    if (booking.status === 'MOVED_IN') {
      booking.status = 'COMPLETED';
    }

    await flushDb();
    return wrapResponse(newReview);
  });
}

/**
 * List all reviews for a specific property.
 */
export async function mockListReviewsByProperty(
  propertyId: string
): Promise<ApiResponse<Review[]>> {
  await simulateLatency();

  const propertyBookingIds = new Set(
    db.bookings.filter((b) => b.propertyId === propertyId).map((b) => b.id)
  );

  const reviews = db.reviews.filter((r) => propertyBookingIds.has(r.bookingId));

  // Hydrate reviewer info for UI display
  const hydrated = reviews.map(r => {
    const reviewer = db.users.find(u => u.id === r.reviewerId);
    return {
      ...r,
      reviewerName: reviewer?.fullName || 'Unknown User'
    };
  });

  return wrapResponse(hydrated);
}
