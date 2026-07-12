/**
 * Mock verification endpoints.
 *
 * Landlords submit identity/property documents for the "Verified Badge".
 * An admin reviews and approves or rejects them. Approval sets
 * isVerified=true on the landlord's properties.
 */

import { db, flushDb, requireAuth, withWriteLock } from './store';
import { generateId, simulateLatency, wrapResponse, wrapError } from '@/utils/format';
import type { ApiResponse, SubmitVerificationRequest } from '@/types';
import type { Verification } from '@/types';

/**
 * Submit a verification document.
 */
export async function mockSubmitVerification(
  landlordId: string,
  req: SubmitVerificationRequest
): Promise<ApiResponse<Verification>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.id !== landlordId || user.role !== 'LANDLORD') {
      return wrapError('UNAUTHORIZED', 'Not authorized');
    }

    const landlord = db.users.find((u) => u.id === landlordId && u.role === 'LANDLORD');
    if (!landlord) {
      return wrapError('LANDLORD_NOT_FOUND', 'Landlord not found');
    }

    const verification: Verification = {
      id: generateId(),
      landlordId,
      propertyId: req.propertyId,
      docType: req.docType,
      docUrl: req.docUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    db.verifications.push(verification);
    if (req.docType === 'GHANA_CARD') {
      landlord.verificationStatus = 'PENDING';
    }
    
    // Notify ADMIN
    const admins = db.users.filter(u => u.role === 'ADMIN');
    admins.forEach(admin => {
      db.notifications.push({
        id: generateId(),
        userId: admin.id,
        title: 'New Verification Request',
        body: `${landlord.fullName} has submitted verification documents.`,
        type: 'SYSTEM',
        isRead: false,
        createdAt: new Date().toISOString(),
        bookingId: undefined, // ensure type conformity if it exists
      });
    });

    await flushDb();
    return wrapResponse(verification);
  });
}

/**
 * Admin approves a verification document.
 */
export async function mockAdminApproveVerification(
  verificationId: string
): Promise<ApiResponse<Verification>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'ADMIN') {
      return wrapError('UNAUTHORIZED', 'Only admins can approve verifications');
    }

    const verification = db.verifications.find((v) => v.id === verificationId);
    if (!verification) {
      return wrapError('VERIFICATION_NOT_FOUND', 'Verification not found');
    }

    if (verification.status !== 'PENDING') {
      return wrapError('ALREADY_REVIEWED', 'This verification has already been reviewed');
    }

    verification.status = 'APPROVED';

    if (verification.docType === 'GHANA_CARD') {
      const landlord = db.users.find((u) => u.id === verification.landlordId);
      if (landlord) landlord.verificationStatus = 'APPROVED';
    } else if (verification.propertyId) {
      const property = db.properties.find((p) => p.id === verification.propertyId);
      if (property) property.isVerified = true;
    }

    db.notifications.push({
      id: generateId(),
      userId: verification.landlordId,
      title: 'Verification Approved',
      body: verification.docType === 'GHANA_CARD' 
        ? 'Your identity documents have been approved. You are now a verified landlord!'
        : 'Your property documents have been approved. The property now has a Verified Badge!',
      type: 'SYSTEM',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    await flushDb();
    return wrapResponse(verification);
  });
}

/**
 * Admin rejects a verification document.
 */
export async function mockAdminRejectVerification(
  verificationId: string
): Promise<ApiResponse<Verification>> {
  return withWriteLock(async () => {
    await simulateLatency();

    const user = requireAuth();
    if (!user || user.role !== 'ADMIN') {
      return wrapError('UNAUTHORIZED', 'Only admins can reject verifications');
    }

    const verification = db.verifications.find((v) => v.id === verificationId);
    if (!verification) {
      return wrapError('VERIFICATION_NOT_FOUND', 'Verification not found');
    }

    if (verification.status !== 'PENDING') {
      return wrapError('ALREADY_REVIEWED', 'This verification has already been reviewed');
    }

    verification.status = 'REJECTED';

    const landlord = db.users.find(u => u.id === verification.landlordId);
    if (landlord) landlord.verificationStatus = 'REJECTED';

    db.notifications.push({
      id: generateId(),
      userId: verification.landlordId,
      title: 'Verification Rejected',
      body: 'Your documents were rejected. Please submit valid documents to get verified.',
      type: 'SYSTEM',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    await flushDb();
    return wrapResponse(verification);
  });
}

/**
 * List all verifications.
 */
export async function mockListVerifications(): Promise<ApiResponse<import('@/types').PaginatedResponse<Verification>>> {
  await simulateLatency();
  
  const user = requireAuth();
  if (!user || user.role !== 'ADMIN') {
    return wrapError('UNAUTHORIZED', 'Only admins can view verifications');
  }

  const sorted = [...db.verifications].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  return wrapResponse({
    content: sorted,
    page: 0,
    size: sorted.length,
    totalElements: sorted.length,
    totalPages: 1,
  });
}
