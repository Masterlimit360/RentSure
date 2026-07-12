package com.rentsure.backend.entity;

import com.rentsure.backend.entity.enums.PaymentMethodType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PaymentMethodType type;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 100)
    private String accountName;

    @Column(nullable = false, length = 50)
    private String accountNumber;

    @Column(length = 50)
    private String provider;

    @Column(nullable = false)
    @Builder.Default
    private boolean isDefault = false;
}
