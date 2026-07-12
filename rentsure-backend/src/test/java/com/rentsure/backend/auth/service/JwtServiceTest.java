package com.rentsure.backend.auth.service;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private final String SECRET = "vErYsEcReTjWtKeYtHaTiSaTlEaSt256BiTsLoNgForTesting";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, 15);
    }

    @Test
    void testGenerateAndExtractClaims() {
        UUID userId = UUID.randomUUID();
        String role = "TENANT";

        String token = jwtService.generateToken(userId, role);
        assertNotNull(token);

        Claims claims = jwtService.extractAllClaims(token);
        assertEquals(userId.toString(), claims.getSubject());
        assertEquals(role, claims.get("role", String.class));
    }
}
