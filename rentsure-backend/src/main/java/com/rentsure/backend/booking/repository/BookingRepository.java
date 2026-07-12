package com.rentsure.backend.booking.repository;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    // IMPORTANT: Pessimistic Write Lock. This forces concurrent threads to queue up 
    // when modifying a booking, completely preventing double-accepts or race conditions.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") UUID id);

    List<Booking> findByTenantId(UUID tenantId);

    List<Booking> findByProperty_Landlord_Id(UUID landlordId);

    boolean existsByTenantIdAndPropertyIdAndStatusIn(UUID tenantId, UUID propertyId, List<BookingStatus> statuses);

    boolean existsByBookingRef(String bookingRef);

    // Bulk update for the Expiry Scheduled Job
    @Modifying
    @Query("UPDATE Booking b SET b.status = 'EXPIRED' WHERE b.status = 'ACCEPTED' AND b.requestedAt < :cutoff")
    int expireStaleBookings(@Param("cutoff") LocalDateTime cutoff);
}
