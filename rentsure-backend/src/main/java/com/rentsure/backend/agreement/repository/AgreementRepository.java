package com.rentsure.backend.agreement.repository;

import com.rentsure.backend.agreement.entity.Agreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgreementRepository extends JpaRepository<Agreement, UUID> {
    Optional<Agreement> findByBookingId(UUID bookingId);
}
