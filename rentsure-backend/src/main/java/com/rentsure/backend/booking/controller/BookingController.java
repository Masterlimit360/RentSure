package com.rentsure.backend.booking.controller;

import com.rentsure.backend.booking.dto.BookingDtos.*;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.service.BookingService;
import com.rentsure.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('TENANT')")
    public ApiResponse<BookingDto> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            Authentication authentication) {
        UUID tenantId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(bookingService.createBooking(request, tenantId));
    }

    @GetMapping("/mine")
    public ApiResponse<List<BookingDto>> getMyBookings(Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(bookingService.getMyBookings(userId));
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasRole('LANDLORD')")
    public ApiResponse<BookingDto> acceptBooking(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID landlordId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(bookingService.transition(id, BookingStatus.ACCEPTED, landlordId, null));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('LANDLORD')")
    public ApiResponse<BookingDto> rejectBooking(
            @PathVariable UUID id,
            @Valid @RequestBody RejectBookingRequest request,
            Authentication authentication) {
        UUID landlordId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(bookingService.transition(id, BookingStatus.REJECTED, landlordId, request.getReason()));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('TENANT')")
    public ApiResponse<BookingDto> cancelBooking(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID tenantId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(bookingService.transition(id, BookingStatus.CANCELLED, tenantId, null));
    }

    @PatchMapping("/{id}/confirm-move-in")
    @PreAuthorize("hasRole('TENANT')")
    public ApiResponse<BookingDto> confirmMoveIn(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID tenantId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(bookingService.transition(id, BookingStatus.MOVED_IN, tenantId, null));
    }
}
