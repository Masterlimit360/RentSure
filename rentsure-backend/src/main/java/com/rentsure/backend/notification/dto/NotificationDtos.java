package com.rentsure.backend.notification.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationDtos {

    @Data
    public static class NotificationDto {
        private UUID id;
        private UUID userId;
        private String type;
        private String title;
        private String body;
        private boolean isRead;
        private LocalDateTime createdAt;
    }
}
