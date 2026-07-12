package com.rentsure.backend.payment.controller;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.payment.entity.Payment;
import com.rentsure.backend.payment.repository.PaymentRepository;
import com.rentsure.backend.property.entity.Property;
import com.rentsure.backend.property.entity.enums.PropertyStatus;
import com.rentsure.backend.property.entity.enums.PropertyType;
import com.rentsure.backend.property.repository.PropertyRepository;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.entity.enums.Role;
import com.rentsure.backend.user.entity.enums.UserStatus;
import com.rentsure.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PaymentControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("app.paystack.secret-key", () -> "test_secret_key");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private Booking booking;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        bookingRepository.deleteAll();
        propertyRepository.deleteAll();
        userRepository.deleteAll();

        User landlord = new User();
        landlord.setFullName("L");
        landlord.setEmail("l@test.com");
        landlord.setPasswordHash("h");
        landlord.setRole(Role.LANDLORD);
        landlord.setStatus(UserStatus.ACTIVE);
        userRepository.save(landlord);

        User tenant = new User();
        tenant.setFullName("T");
        tenant.setEmail("t@test.com");
        tenant.setPasswordHash("h");
        tenant.setRole(Role.TENANT);
        tenant.setStatus(UserStatus.ACTIVE);
        userRepository.save(tenant);

        Property property = new Property();
        property.setLandlord(landlord);
        property.setTitle("P");
        property.setDescription("D");
        property.setPropertyType(PropertyType.APARTMENT);
        property.setRegion("R");
        property.setCity("C");
        property.setArea("A");
        property.setGpsLat(new BigDecimal("1.0"));
        property.setGpsLng(new BigDecimal("1.0"));
        property.setPricePerYear(new BigDecimal("1200"));
        property.setBedrooms(1);
        property.setBathrooms(1);
        property.setStatus(PropertyStatus.AVAILABLE);
        propertyRepository.save(property);

        booking = new Booking();
        booking.setProperty(property);
        booking.setTenant(tenant);
        booking.setStatus(BookingStatus.ACCEPTED); // Ready for payment
        booking.setMoveInDate(LocalDate.now());
        booking.setDurationMonths(12);
        booking.setTotalAmount(new BigDecimal("1200.00")); // + 5% fee = 1260
        booking.setBookingRef("RS-TEST");
        bookingRepository.save(booking);
    }

    private String generateSignature(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKeySpec = new SecretKeySpec("test_secret_key".getBytes(), "HmacSHA512");
        mac.init(secretKeySpec);
        byte[] hashBytes = mac.doFinal(payload.getBytes());
        StringBuilder hashString = new StringBuilder();
        for (byte b : hashBytes) {
            hashString.append(String.format("%02x", b));
        }
        return hashString.toString();
    }

    @Test
    void testWebhook_RejectsInvalidSignature() throws Exception {
        String payload = "{\"event\":\"charge.success\"}";
        
        mockMvc.perform(post("/api/v1/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("x-paystack-signature", "invalid_signature"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testWebhook_AcceptsValidSignatureAndProcessesPaymentIdempotently() throws Exception {
        // Amount should be 1260 GHS -> 126000 pesewas
        String payload = String.format("""
            {
                "event": "charge.success",
                "data": {
                    "reference": "TEST-REF-123",
                    "amount": 126000,
                    "status": "success",
                    "metadata": {
                        "bookingId": "%s"
                    }
                }
            }
        """, booking.getId());

        String signature = generateSignature(payload);

        // First delivery
        mockMvc.perform(post("/api/v1/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("x-paystack-signature", signature))
                .andExpect(status().isOk());

        // Validate state
        List<Payment> payments = paymentRepository.findAll();
        assertEquals(1, payments.size());
        assertEquals("TEST-REF-123", payments.get(0).getPaystackRef());
        
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.PAID_ESCROW, updatedBooking.getStatus());

        // Second delivery (Idempotency check)
        mockMvc.perform(post("/api/v1/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("x-paystack-signature", signature))
                .andExpect(status().isOk()); // Should silently return 200

        // Still exactly 1 payment
        assertEquals(1, paymentRepository.findAll().size());
    }
}
