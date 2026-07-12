package com.rentsure.backend.payment.dto;

import com.rentsure.backend.payment.entity.enums.EscrowStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class PaymentDtos {

    @Data
    public static class PaymentInitializationResponse {
        private String checkoutUrl;
        private String reference;
        private String accessCode;
    }

    @Data
    public static class PaymentStatusDto {
        private UUID bookingId;
        private String paystackRef;
        private BigDecimal amount;
        private EscrowStatus escrowStatus;
        private LocalDateTime paidAt;
        private LocalDateTime releasedAt;
    }
}
