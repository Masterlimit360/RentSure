/**
 * Formatting helpers for Ghana-specific display conventions.
 *
 * All currency formatting uses GHS (Ghana Cedi) with the ₵ symbol.
 * Dates use the en-GB locale for day-month-year ordering, which
 * matches Ghanaian conventions.
 */

/**
 * Format a number as Ghana Cedis (e.g. 12500 → "GH₵ 12,500.00").
 * Used on property cards, booking summaries, and payment receipts.
 */
export function formatCurrency(amount: number): string {
  return `GH₵ ${amount.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format an ISO date string to a human-readable Ghanaian format.
 * Returns "12 Jul 2026" style — day-first, abbreviated month.
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a booking reference for display, ensuring uppercase.
 * Booking refs are already formatted (e.g. "RS-8F3K2A") but this
 * guards against accidental lowercase from user input or tests.
 */
export function formatBookingRef(ref: string): string {
  return ref.toUpperCase();
}

/**
 * Generate a random UUID v4 string.
 * Used by the mock layer to create IDs without a crypto dependency.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    /* 'y' slots are constrained to 8/9/a/b per RFC 4122 variant-1 */
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a human-readable booking reference like "RS-8F3K2A".
 * Prefix "RS-" for RentSure + 6 alphanumeric chars (uppercase).
 * Collision risk is negligible for our expected booking volume.
 */
export function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'RS-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

/**
 * Simulate network latency for mock API calls.
 * Returns a promise that resolves after 250–800ms (random),
 * mimicking a realistic mobile-to-server round trip in Ghana.
 * Optionally simulates a 1-in-25 transient 500 error for testing retry logic.
 */
export function simulateLatency(options?: { canFail?: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    const ms = 250 + Math.random() * 550;
    setTimeout(() => {
      // Dev toggle: simulated transient failure
      if (options?.canFail && Math.random() < 0.04) { // 4% chance (~1 in 25)
        reject(new Error('Simulated transient 500 Internal Server Error'));
      } else {
        resolve();
      }
    }, ms);
  });
}

/**
 * Wrap a value in the standard ApiResponse envelope.
 * Used by every mock endpoint to match the real API shape.
 */
export function wrapResponse<T>(data: T): {
  success: true;
  data: T;
  error: null;
  timestamp: string;
} {
  return {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wrap an error in the standard ApiResponse envelope.
 * Used by mock endpoints to simulate server-side validation errors.
 */
export function wrapError(code: string, message: string): {
  success: false;
  data: null;
  error: { code: string; message: string };
  timestamp: string;
} {
  return {
    success: false,
    data: null,
    error: { code, message },
    timestamp: new Date().toISOString(),
  };
}
