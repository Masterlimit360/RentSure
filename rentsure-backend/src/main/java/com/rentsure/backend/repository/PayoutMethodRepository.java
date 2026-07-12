package com.rentsure.backend.repository;

import com.rentsure.backend.entity.PayoutMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PayoutMethodRepository extends JpaRepository<PayoutMethod, UUID> {
}
