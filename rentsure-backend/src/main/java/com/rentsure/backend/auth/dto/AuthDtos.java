package com.rentsure.backend.auth.dto;

import com.rentsure.backend.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Authentication DTOs mirroring the frontend contract exactly.
 */
public class AuthDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank
        private String fullName;
        
        @Email
        @NotBlank
        private String email;
        
        @NotBlank
        private String phone;
        
        @NotBlank
        private String password;
        
        @NotNull
        private Role role;
    }

    @Data
    public static class VerifyEmailRequest {
        @Email
        @NotBlank
        private String email;
        
        @NotBlank
        private String otp;
    }

    @Data
    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;
        
        @NotBlank
        private String password;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private Object user; // We'll return the User entity or a UserDto mapped to match the contract
    }
}
