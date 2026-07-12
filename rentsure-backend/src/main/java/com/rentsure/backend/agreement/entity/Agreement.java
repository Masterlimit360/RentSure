package com.rentsure.backend.agreement.entity;

import com.rentsure.backend.booking.entity.Booking;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a legally binding tenancy agreement document.
 */
@Entity
@Table(name = "agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agreement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String pdfUrl;

    private LocalDateTime tenantSignedAt;
    
    private LocalDateTime landlordSignedAt;
}
