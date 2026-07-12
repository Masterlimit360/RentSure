/**
 * Mock booking endpoints.
 *
 * Enforces the booking state machine transitions defined in
 * src/mocks/store.ts VALID_TRANSITIONS. Every status change is validated
 * against that map — attempting an illegal transition returns
 * INVALID_STATE (HTTP 409 equivalent).
 */

import { db, VALID_TRANSITIONS, flushDb, requireAuth, withWriteLock } from './store';
import {
  generateId,
  generateBookingRef,
  simulateLatency,
  wrapResponse,
  wrapError,
} from '@/utils/format';
import type {
  ApiResponse,
  CreateBookingRequest,
} from '@/types';
import type { Booking, Payment, Notification, Agreement } from '@/types';

/**
 * Create a new booking request for a property.
 */
export async function mockCreateBooking(
  tenantId: string,
  req: CreateBookingRequest
): Promise<ApiResponse<Booking>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'TENANT' || user.id !== tenantId) {
      return wrapError('UNAUTHORIZED', 'Not authorized to create booking for this tenant');
    }

    const property = db.properties.find((p) => p.id === req.propertyId);
    if (!property) {
      return wrapError('PROPERTY_NOT_FOUND', 'Property not found');
    }

    if (property.status !== 'AVAILABLE') {
      return wrapError('PROPERTY_UNAVAILABLE', 'This property is no longer available');
    }

    /* Prevent duplicate active bookings for the same property */
    const terminalStatuses = ['REJECTED', 'EXPIRED', 'COMPLETED'];
    const existingActive = db.bookings.find(
      (b) =>
        b.propertyId === req.propertyId &&
        b.tenantId === tenantId &&
        !terminalStatuses.includes(b.status)
    );
    if (existingActive) {
      return wrapError('DUPLICATE_BOOKING', 'You already have an active booking for this property');
    }

    const newBooking: Booking = {
      id: generateId(),
      propertyId: req.propertyId,
      tenantId,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
      moveInDate: req.moveInDate,
      durationMonths: req.durationMonths,
      totalAmount: property.pricePerYear * (req.durationMonths / 12),
      bookingRef: generateBookingRef(),
    };

    db.bookings.push(newBooking);

    // Cross-Account Write: Notify Landlord
    db.notifications.push({
      id: generateId(),
      userId: property.landlordId,
      type: 'BOOKING_REQUESTED',
      title: 'New Booking Request',
      body: `A tenant has requested booking ${newBooking.bookingRef} for your ${property.title}.`,
      bookingId: newBooking.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    await flushDb();
    return wrapResponse(newBooking);
  });
}

/**
 * List bookings belonging to the current user.
 */
export async function mockListMyBookings(
  userId: string,
  userRole: 'TENANT' | 'LANDLORD'
): Promise<ApiResponse<Booking[]>> {
  await simulateLatency();

  const user = requireAuth();
  if (!user || user.id !== userId || user.role !== userRole) {
    return wrapError('UNAUTHORIZED', 'Not authorized');
  }

  let bookings: Booking[];

  if (userRole === 'TENANT') {
    bookings = db.bookings.filter((b) => b.tenantId === userId);
  } else {
    /* Landlords see bookings on properties they own */
    const myPropertyIds = new Set(
      db.properties.filter((p) => p.landlordId === userId).map((p) => p.id)
    );
    bookings = db.bookings.filter((b) => myPropertyIds.has(b.propertyId));
  }

  // Hydrate bookings with display data
  const hydratedBookings = bookings.map(b => {
    const property = db.properties.find(p => p.id === b.propertyId);
    const tenant = db.users.find(u => u.id === b.tenantId);
    const landlord = db.users.find(u => u.id === property?.landlordId);
    
    return {
      ...b,
      propertyTitle: property?.title,
      propertyImage: property?.media?.[0]?.url,
      tenantName: tenant?.fullName,
      tenantPhone: tenant?.phone,
      landlordName: landlord?.fullName,
    };
  });

  return wrapResponse(hydratedBookings.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
}

/**
 * Landlord accepts a booking request.
 */
export async function mockAcceptBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'LANDLORD') return wrapError('UNAUTHORIZED', 'Only landlords can accept bookings');

    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) return wrapError('BOOKING_NOT_FOUND', 'Booking not found');

    const property = db.properties.find((p) => p.id === booking.propertyId);
    if (!property || property.landlordId !== user.id) {
      return wrapError('FORBIDDEN', 'You do not own this property');
    }

    const result = transitionBooking(bookingId, 'ACCEPTED');
    if (result.success) {
      db.notifications.push({
        id: generateId(),
        userId: booking.tenantId,
        type: 'BOOKING_ACCEPTED',
        title: 'Booking Accepted',
        body: `Your booking ${booking.bookingRef} for ${property.title} has been accepted. Pay now to secure it.`,
        bookingId: booking.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      await flushDb();
    }
    return result;
  });
}

/**
 * Landlord rejects a booking request.
 */
export async function mockRejectBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'LANDLORD') return wrapError('UNAUTHORIZED', 'Only landlords can reject bookings');

    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) return wrapError('BOOKING_NOT_FOUND', 'Booking not found');

    const property = db.properties.find((p) => p.id === booking.propertyId);
    if (!property || property.landlordId !== user.id) {
      return wrapError('FORBIDDEN', 'You do not own this property');
    }

    const result = transitionBooking(bookingId, 'REJECTED');
    if (result.success) {
      db.notifications.push({
        id: generateId(),
        userId: booking.tenantId,
        type: 'BOOKING_REJECTED',
        title: 'Booking Rejected',
        body: `Your booking ${booking.bookingRef} for ${property.title} was declined by the landlord.`,
        bookingId: booking.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      await flushDb();
    }
    return result;
  });
}

/**
 * Tenant confirms they've moved in, which releases escrow to the landlord.
 */
export async function mockConfirmMoveIn(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'TENANT') return wrapError('UNAUTHORIZED', 'Only tenants can confirm move in');

    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.tenantId !== user.id) return wrapError('FORBIDDEN', 'Not your booking');

    const result = transitionBooking(bookingId, 'MOVED_IN');

    if (result.success) {
      const payment = db.payments.find((p) => p.bookingId === bookingId);
      if (payment) {
        payment.escrowStatus = 'RELEASED';
        payment.releasedAt = new Date().toISOString();
      }

      const property = db.properties.find((p) => p.id === booking.propertyId);
      if (property) {
        db.notifications.push({
          id: generateId(),
          userId: property.landlordId,
          type: 'PAYMENT_RECEIVED',
          title: 'Escrow Released',
          body: `The tenant has confirmed move-in for ${booking.bookingRef}. Escrow funds of GHS ${booking.totalAmount} have been released to your payout account.`,
          bookingId: booking.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      await flushDb();
    }

    return result;
  });
}

/**
 * Tenant pays for an accepted booking, transitioning it to PAID_ESCROW.
 */
export async function mockPayBooking(
  bookingId: string
): Promise<ApiResponse<Booking>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'TENANT') return wrapError('UNAUTHORIZED', 'Only tenants can pay');

    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.tenantId !== user.id) return wrapError('FORBIDDEN', 'Not your booking');

    const result = transitionBooking(bookingId, 'PAID_ESCROW');

    if (result.success) {
      const property = db.properties.find((p) => p.id === booking.propertyId);
      if (property) {
        // Property flips to RENTED so it vanishes from search
        property.status = 'RENTED';

        const payment: Payment = {
          id: generateId(),
          bookingId: booking.id,
          paystackRef: `PSK-REF-${Date.now()}`,
          amount: booking.totalAmount,
          fee: booking.totalAmount * 0.015,
          escrowStatus: 'HELD',
          paidAt: new Date().toISOString(),
        };
        db.payments.push(payment);

        // Auto-create agreement
        const agreement: Agreement = {
          id: generateId(),
          bookingId: booking.id,
          pdfUrl: `https://rentsure.com/mock-agreements/agr-${Date.now()}.pdf`,
        };
        db.agreements.push(agreement);

        // Notify landlord
        db.notifications.push({
          id: generateId(),
          userId: property.landlordId,
          type: 'PAYMENT_RECEIVED',
          title: 'Escrow Payment Received',
          body: `GHS ${booking.totalAmount} is now held in escrow for booking ${booking.bookingRef}. Both parties must now sign the agreement.`,
          bookingId: booking.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
      await flushDb();
    }

    return result;
  });
}

export async function mockCancelBooking(bookingId: string): Promise<ApiResponse<Booking>> {
  return withWriteLock(async () => {
    await simulateLatency();
    const user = requireAuth();
    if (!user || user.role !== 'TENANT') return wrapError('UNAUTHORIZED', 'Only tenants can cancel bookings');

    const booking = db.bookings.find(b => b.id === bookingId);
    if (!booking) return wrapError('NOT_FOUND', 'Booking not found');
    if (booking.tenantId !== user.id) return wrapError('FORBIDDEN', 'Not your booking');

    if (booking.status !== 'REQUESTED' && booking.status !== 'ACCEPTED') {
      return wrapError('INVALID_STATE', 'Cannot cancel from this state');
    }

    const result = transitionBooking(bookingId, 'CANCELLED');
    if (result.success) {
      const property = db.properties.find(p => p.id === booking.propertyId);
      if (property) {
        db.notifications.push({
          id: generateId(),
          userId: property.landlordId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          body: `The tenant has cancelled the booking for ${property.title}.`,
          bookingId: booking.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
      await flushDb();
    }
    return result;
  });
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function transitionBooking(
  bookingId: string,
  targetStatus: Booking['status']
): ApiResponse<Booking> {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return wrapError('BOOKING_NOT_FOUND', 'Booking not found');
  }

  const allowed = VALID_TRANSITIONS[booking.status];
  if (!allowed.includes(targetStatus)) {
    return wrapError(
      'INVALID_STATE',
      `Cannot transition from ${booking.status} to ${targetStatus}`
    );
  }

  booking.status = targetStatus;
  return wrapResponse(booking);
}
