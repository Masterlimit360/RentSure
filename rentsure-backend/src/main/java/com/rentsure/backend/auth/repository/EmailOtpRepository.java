package com.rentsure.backend.auth.repository;

import com.rentsure.backend.auth.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, UUID> {
    Optional<EmailOtp> findTopByEmailOrderByCreatedAtDesc(String email);
    void deleteByEmail(String email);
}
