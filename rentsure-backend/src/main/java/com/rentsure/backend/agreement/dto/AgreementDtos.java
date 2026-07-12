package com.rentsure.backend.agreement.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

public class AgreementDtos {

    @Data
    public static class AgreementDto {
        private UUID id;
        private UUID bookingId;
        private String pdfUrl;
        private LocalDateTime tenantSignedAt;
        private LocalDateTime landlordSignedAt;
    }
}
