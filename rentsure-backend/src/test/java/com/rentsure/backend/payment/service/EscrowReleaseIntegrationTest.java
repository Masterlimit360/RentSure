package com.rentsure.backend.payment.service;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.booking.service.BookingService;
import com.rentsure.backend.payment.entity.Payment;
import com.rentsure.backend.payment.entity.enums.EscrowStatus;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Testcontainers
class EscrowReleaseIntegrationTest {

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
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private User landlord;
    private User tenant;
    private Property property;
    private Booking booking;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        bookingRepository.deleteAll();
        propertyRepository.deleteAll();
        userRepository.deleteAll();

        landlord = new User();
        landlord.setFullName("L");
        landlord.setEmail("l@test.com");
        landlord.setPasswordHash("h");
        landlord.setRole(Role.LANDLORD);
        landlord.setStatus(UserStatus.ACTIVE);
        userRepository.save(landlord);

        tenant = new User();
        tenant.setFullName("T");
        tenant.setEmail("t@test.com");
        tenant.setPasswordHash("h");
        tenant.setRole(Role.TENANT);
        tenant.setStatus(UserStatus.ACTIVE);
        userRepository.save(tenant);

        property = new Property();
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
        booking.setStatus(BookingStatus.PAID_ESCROW); 
        booking.setMoveInDate(LocalDate.now());
        booking.setDurationMonths(12);
        booking.setTotalAmount(new BigDecimal("1200.00"));
        booking.setBookingRef("RS-TEST2");
        bookingRepository.save(booking);

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setPaystackRef("PAY-12345");
        payment.setAmount(new BigDecimal("1260.00"));
        payment.setFee(new BigDecimal("60.00"));
        payment.setEscrowStatus(EscrowStatus.HELD);
        paymentRepository.save(payment);
    }

    @Test
    void testEscrowIsReleasedWhenTenantConfirmsMoveIn() {
        // Trigger move-in transition, which publishes BookingMovedInEvent
        bookingService.transition(booking.getId(), BookingStatus.MOVED_IN, tenant.getId(), null);

        // Verify that EscrowReleaseListener caught it and released funds
        Payment updatedPayment = paymentRepository.findByBookingId(booking.getId()).orElseThrow();
        assertEquals(EscrowStatus.RELEASED, updatedPayment.getEscrowStatus());
        assertNotNull(updatedPayment.getReleasedAt());
    }
}
