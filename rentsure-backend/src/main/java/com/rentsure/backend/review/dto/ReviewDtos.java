package com.rentsure.backend.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

public class ReviewDtos {

    @Data
    public static class CreateReviewRequest {
        @NotNull
        private UUID bookingId;

        @NotNull
        @Min(1)
        @Max(5)
        private Integer rating;

        private String comment;
    }

    @Data
    public static class ReviewDto {
        private UUID id;
        private UUID bookingId;
        private UUID reviewerId;
        private UUID revieweeId;
        private Integer rating;
        private String comment;
        private LocalDateTime createdAt;
    }
}
