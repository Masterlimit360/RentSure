package com.rentsure.backend.agreement.controller;

import com.rentsure.backend.agreement.dto.AgreementDtos.AgreementDto;
import com.rentsure.backend.agreement.service.AgreementService;
import com.rentsure.backend.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agreements")
@RequiredArgsConstructor
public class AgreementController {

    private final AgreementService agreementService;

    @GetMapping("/booking/{bookingId}")
    public ApiResponse<AgreementDto> getAgreement(
            @PathVariable UUID bookingId,
            Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(agreementService.getAgreementByBookingId(bookingId, userId));
    }

    @PatchMapping("/booking/{bookingId}/sign")
    public ApiResponse<AgreementDto> signAgreement(
            @PathVariable UUID bookingId,
            Authentication authentication) {
        UUID userId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(agreementService.signAgreement(bookingId, userId));
    }
}
