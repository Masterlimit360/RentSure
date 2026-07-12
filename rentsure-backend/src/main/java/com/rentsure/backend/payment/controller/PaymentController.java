package com.rentsure.backend.payment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentsure.backend.common.ApiResponse;
import com.rentsure.backend.payment.dto.PaymentDtos.PaymentInitializationResponse;
import com.rentsure.backend.payment.dto.PaymentDtos.PaymentStatusDto;
import com.rentsure.backend.payment.service.PaymentService;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

/**
 * REST Controller for Paystack checkout initialization and webhook handling.
 * Defines the public entry points for the rent payment lifecycle.
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.paystack.secret-key:sk_test_placeholder}")
    private String secretKey;

    @PostMapping("/initialize/{bookingId}")
    @PreAuthorize("hasRole('TENANT')")
    public ApiResponse<PaymentInitializationResponse> initializePayment(
            @PathVariable UUID bookingId,
            Authentication authentication) {
        UUID tenantId = UUID.fromString((String) authentication.getPrincipal());
        User tenant = userRepository.findById(tenantId).orElseThrow();
        
        return ApiResponse.success(paymentService.initializePayment(bookingId, tenant));
    }

    @GetMapping("/{bookingId}/status")
    public ApiResponse<PaymentStatusDto> getPaymentStatus(@PathVariable UUID bookingId) {
        return ApiResponse.success(paymentService.getPaymentStatus(bookingId));
    }

    /**
     * Webhook endpoint called by Paystack.
     * IMPORTANT: This endpoint MUST be unauthenticated in SecurityConfig, as Paystack has no JWT.
     * Security is handled exclusively by HMAC-SHA512 signature verification.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader("x-paystack-signature") String signature,
            @RequestBody String rawBody) {
        
        // 1. Verify Signature
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(), "HmacSHA512");
            mac.init(secretKeySpec);
            byte[] hashBytes = mac.doFinal(rawBody.getBytes());
            
            StringBuilder hashString = new StringBuilder();
            for (byte b : hashBytes) {
                hashString.append(String.format("%02x", b));
            }

            if (!hashString.toString().equals(signature)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        // 2. Parse payload and process
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = root.path("event").asText();
            JsonNode data = root.path("data");
            
            String reference = data.path("reference").asText();
            BigDecimal amount = new BigDecimal(data.path("amount").asText());
            String status = data.path("status").asText();
            String bookingId = data.path("metadata").path("bookingId").asText();

            paymentService.handleWebhook(event, reference, amount, status, bookingId);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // Acknowledge receipt with 200 OK to prevent Paystack from endlessly retrying failing payloads
            return ResponseEntity.ok().build(); 
        }
    }
}
