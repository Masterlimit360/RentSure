package com.rentsure.backend.booking.service;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.common.exception.InvalidStateException;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Testcontainers
class BookingServiceConcurrencyTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private User landlord;
    private User tenant;
    private Property property;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        propertyRepository.deleteAll();
        userRepository.deleteAll();

        landlord = new User();
        landlord.setFullName("Landlord");
        landlord.setEmail("l@test.com");
        landlord.setPasswordHash("hash");
        landlord.setPhone("123");
        landlord.setRole(Role.LANDLORD);
        landlord.setStatus(UserStatus.ACTIVE);
        userRepository.save(landlord);

        tenant = new User();
        tenant.setFullName("Tenant");
        tenant.setEmail("t@test.com");
        tenant.setPasswordHash("hash");
        tenant.setPhone("456");
        tenant.setRole(Role.TENANT);
        tenant.setStatus(UserStatus.ACTIVE);
        userRepository.save(tenant);

        property = new Property();
        property.setLandlord(landlord);
        property.setTitle("Test Property");
        property.setDescription("Desc");
        property.setPropertyType(PropertyType.APARTMENT);
        property.setRegion("Region");
        property.setCity("City");
        property.setArea("Area");
        property.setGpsLat(new BigDecimal("1.0"));
        property.setGpsLng(new BigDecimal("1.0"));
        property.setPricePerYear(new BigDecimal("12000"));
        property.setBedrooms(1);
        property.setBathrooms(1);
        property.setStatus(PropertyStatus.AVAILABLE);
        propertyRepository.save(property);
    }

    @Test
    void testConcurrentAcceptance_PessimisticLockSerializes() throws InterruptedException {
        Booking booking = new Booking();
        booking.setTenant(tenant);
        booking.setProperty(property);
        booking.setStatus(BookingStatus.REQUESTED);
        booking.setDurationMonths(12);
        booking.setMoveInDate(LocalDate.now());
        booking.setTotalAmount(new BigDecimal("12000"));
        booking.setBookingRef("RS-123456");
        bookingRepository.save(booking);

        int threadCount = 3;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executorService.execute(() -> {
                try {
                    bookingService.transition(booking.getId(), BookingStatus.ACCEPTED, landlord.getId(), null);
                    successCount.incrementAndGet();
                } catch (InvalidStateException e) {
                    // This is expected! The first thread wins, locks the row, updates status to ACCEPTED.
                    // The subsequent threads block until lock is released, then read the NEW status (ACCEPTED),
                    // and throw InvalidStateException because transition REQUESTED -> ACCEPTED is no longer valid.
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();

        // Exactly ONE transaction should succeed, the rest MUST fail safely without corrupting state.
        assertEquals(1, successCount.get());
        assertEquals(2, failureCount.get());

        Booking updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.ACCEPTED, updated.getStatus());
    }
}
