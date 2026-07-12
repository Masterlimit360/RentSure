package com.rentsure.backend.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * Handles generation and validation of stateless JWT access tokens.
 * All access token verification happens strictly through this service.
 */
@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiration-minutes}") long expirationMinutes) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMinutes = expirationMinutes;
    }

    /**
     * Generates a short-lived access token for the given user ID and role.
     *
     * @param userId The UUID of the authenticated user.
     * @param role The user's role (TENANT, LANDLORD, ADMIN).
     * @return A signed JWT string.
     */
    public String generateToken(UUID userId, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of("role", role))
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMinutes * 60 * 1000))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Extracts and validates the token. Throws exceptions if expired or tampered.
     *
     * @param token The raw JWT string.
     * @return The extracted Claims payload.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
