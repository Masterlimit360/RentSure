package com.rentsure.backend.repository;

import com.rentsure.backend.entity.Verification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VerificationRepository extends JpaRepository<Verification, UUID> {
}
