package com.rentsure.backend.entity;

import com.rentsure.backend.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private BookingStatus status = BookingStatus.REQUESTED;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime requestedAt;

    @Column(nullable = false)
    private LocalDate moveInDate;

    @Column(nullable = false)
    private Integer durationMonths;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(unique = true, nullable = false, length = 12)
    private String bookingRef;
    
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    private Payment payment;
    
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    private Agreement agreement;
}
