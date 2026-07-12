package com.rentsure.backend.notification.controller;

import com.rentsure.backend.common.ApiResponse;
import com.rentsure.backend.common.PaginatedResponse;
import com.rentsure.backend.notification.dto.NotificationDtos.NotificationDto;
import com.rentsure.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<PaginatedResponse<NotificationDto>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        Page<NotificationDto> notifications = notificationService.getMyNotifications(userId, page, size);
        return ApiResponse.success(new PaginatedResponse<>(notifications));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationDto> markAsRead(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(notificationService.markAsRead(id, userId));
    }
}
