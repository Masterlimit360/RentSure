package com.rentsure.backend.payment.client;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

/**
 * RestClient wrapper for Paystack API.
 */
@Component
public class PaystackClient {

    private final RestClient restClient;

    public PaystackClient(@Value("${app.paystack.secret-key:sk_test_placeholder}") String secretKey) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.paystack.co")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public PaystackInitializationResponse initializeTransaction(String email, BigDecimal amountInPesewas, String reference, String bookingId) {
        // Paystack expects amount in lowest denomination (pesewas) as string or long
        long amount = amountInPesewas.longValue();

        Map<String, Object> body = Map.of(
                "email", email,
                "amount", amount,
                "reference", reference,
                "currency", "GHS",
                "metadata", Map.of("bookingId", bookingId)
        );

        return restClient.post()
                .uri("/transaction/initialize")
                .body(body)
                .retrieve()
                .body(PaystackInitializationResponse.class);
    }

    @Data
    public static class PaystackInitializationResponse {
        private boolean status;
        private String message;
        private Data data;

        @lombok.Data
        public static class Data {
            private String authorization_url;
            private String access_code;
            private String reference;
        }
    }
}
