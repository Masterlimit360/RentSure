package com.rentsure.backend.auth.service;

import com.rentsure.backend.auth.dto.AuthDtos.*;
import com.rentsure.backend.auth.entity.EmailOtp;
import com.rentsure.backend.auth.entity.RefreshToken;
import com.rentsure.backend.auth.repository.EmailOtpRepository;
import com.rentsure.backend.auth.repository.RefreshTokenRepository;
import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.entity.User;
import com.rentsure.backend.entity.enums.UserStatus;
import com.rentsure.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Authentication service orchestration.
 * Handles the registration and login flows, including email verification and token rotation.
 * All authentication logic lives here—controllers are thin wrappers.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmailOtpRepository emailOtpRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.jwt.refresh-token-expiration-days:7}")
    private long refreshTokenDays;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Registers a new user.
     * Preconditions: The request must contain valid formatting and a role of TENANT or LANDLORD.
     * Throws: InvalidStateException if the email or phone is already registered.
     */
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            // One account per email: prevents duplicate accounts and ensures unique logins
            throw new InvalidStateException("Email is already registered");
        }
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new InvalidStateException("Phone number is already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        userRepository.save(user);

        generateAndStoreOtp(user.getEmail());
    }

    /**
     * Verifies the email using the 6-digit OTP.
     * Preconditions: The user must exist and an OTP must have been sent.
     * Throws: InvalidStateException if the OTP is missing, expired, or incorrect. NotFoundException if user doesn't exist.
     */
    @Transactional
    public TokenResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("User not found"));

        EmailOtp otpEntity = emailOtpRepository.findTopByEmailOrderByCreatedAtDesc(user.getEmail())
                .orElseThrow(() -> new InvalidStateException("No OTP found. Please request a new one."));

        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            // 10-minute expiry enforces quick verification and prevents OTP hoarding
            throw new InvalidStateException("OTP has expired");
        }
        if (!otpEntity.getOtp().equals(request.getOtp())) {
            throw new InvalidStateException("Invalid OTP");
        }

        user.setVerifiedEmail(true);
        userRepository.save(user);
        emailOtpRepository.deleteByEmail(user.getEmail());

        return generateTokenResponse(user, UUID.randomUUID());
    }

    /**
     * Authenticates a user and issues new tokens.
     * Preconditions: The user must exist, be ACTIVE, and have a verified email.
     * Throws: BadCredentialsException for invalid email/password. InvalidStateException for unverified or suspended users.
     */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!user.isVerifiedEmail()) {
            // Unverified users cannot authenticate to protect platform integrity
            throw new InvalidStateException("Please verify your email before logging in");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new InvalidStateException("Your account has been suspended");
        }

        return generateTokenResponse(user, UUID.randomUUID());
    }

    /**
     * Rotates the refresh token and issues a new access token.
     * Preconditions: The refresh token must be valid, unexpired, and not revoked.
     * Throws: BadCredentialsException if the token is invalid, expired, or if token reuse is detected.
     */
    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        String rawToken = request.getRefreshToken();
        
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(rawToken)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            // IMPORTANT: Token reuse detected. Revoke the entire family to mitigate stolen tokens.
            List<RefreshToken> family = refreshTokenRepository.findByFamilyId(refreshToken.getFamilyId());
            family.forEach(t -> t.setRevoked(true));
            refreshTokenRepository.saveAll(family);
            throw new BadCredentialsException("Token reuse detected. Please login again.");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Refresh token expired");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return generateTokenResponse(refreshToken.getUser(), refreshToken.getFamilyId());
    }

    /**
     * Revokes all refresh tokens for the user.
     * Preconditions: The user must be authenticated.
     */
    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.deleteByUser_Id(userId);
    }

    private void generateAndStoreOtp(String email) {
        emailOtpRepository.deleteByEmail(email);

        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        
        // In dev, log the OTP. We'll simulate this with a simple print for now.
        System.out.println("DEV ONLY - OTP for " + email + ": " + otp);

        EmailOtp otpEntity = EmailOtp.builder()
                .email(email)
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        emailOtpRepository.save(otpEntity);
    }

    private TokenResponse generateTokenResponse(User user, UUID familyId) {
        String accessToken = jwtService.generateToken(user.getId(), user.getRole().name());
        String rawRefreshToken = UUID.randomUUID().toString(); // The opaque token sent to the client

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(rawRefreshToken) // In a real prod we'd use a deterministic hash like SHA-256
                .familyId(familyId)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenDays))
                .build();
        
        refreshTokenRepository.save(refreshTokenEntity);

        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(rawRefreshToken);
        response.setUser(user);
        return response;
    }
}
