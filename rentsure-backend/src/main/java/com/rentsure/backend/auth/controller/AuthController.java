package com.rentsure.backend.auth.controller;

import com.rentsure.backend.auth.dto.AuthDtos.*;
import com.rentsure.backend.auth.service.AuthService;
import com.rentsure.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for all authentication endpoints.
 * Maps 1-to-1 with the frontend api.ts functions.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ApiResponse.success(null);
    }

    @PostMapping("/verify-email")
    public ApiResponse<TokenResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ApiResponse.success(authService.verifyEmail(request));
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.success(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            UUID userId = UUID.fromString((String) authentication.getPrincipal());
            authService.logout(userId);
        }
        return ApiResponse.success(null);
    }
}
