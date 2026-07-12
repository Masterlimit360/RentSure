package com.rentsure.backend.payment.repository;

import com.rentsure.backend.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaystackRef(String paystackRef);
    Optional<Payment> findByBookingId(UUID bookingId);
}
