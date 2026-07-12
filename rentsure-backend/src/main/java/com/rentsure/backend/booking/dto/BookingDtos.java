package com.rentsure.backend.booking.dto;

import com.rentsure.backend.booking.entity.enums.BookingStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class BookingDtos {

    @Data
    public static class CreateBookingRequest {
        @NotNull
        private UUID propertyId;

        @NotNull
        @Future
        private LocalDate moveInDate;

        @NotNull
        @Min(1)
        private Integer durationMonths;
    }

    @Data
    public static class RejectBookingRequest {
        @NotNull
        private String reason;
    }

    @Data
    public static class BookingDto {
        private UUID id;
        private UUID propertyId;
        private UUID tenantId;
        private BookingStatus status;
        private LocalDateTime requestedAt;
        private LocalDate moveInDate;
        private Integer durationMonths;
        private BigDecimal totalAmount;
        private String bookingRef;
        private String rejectReason;
        private LocalDateTime updatedAt;
    }
}
