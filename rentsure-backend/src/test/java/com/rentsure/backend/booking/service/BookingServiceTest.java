package com.rentsure.backend.booking.service;

import com.rentsure.backend.booking.dto.BookingDtos.CreateBookingRequest;
import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.property.entity.Property;
import com.rentsure.backend.property.entity.enums.PropertyStatus;
import com.rentsure.backend.property.repository.PropertyRepository;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.entity.enums.Role;
import com.rentsure.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private PropertyRepository propertyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testTenantCannotAcceptBooking() {
        UUID tenantId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();

        User tenant = new User();
        tenant.setId(tenantId);
        tenant.setRole(Role.TENANT);

        User landlord = new User();
        landlord.setId(UUID.randomUUID());

        Property property = new Property();
        property.setLandlord(landlord);

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setTenant(tenant);
        booking.setProperty(property);
        booking.setStatus(BookingStatus.REQUESTED);

        when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        assertThrows(AccessDeniedException.class, () -> 
            bookingService.transition(bookingId, BookingStatus.ACCEPTED, tenantId, null)
        );
    }

    @Test
    void testLandlordCannotCancelBooking() {
        UUID landlordId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();

        User tenant = new User();
        tenant.setId(UUID.randomUUID());

        User landlord = new User();
        landlord.setId(landlordId);
        landlord.setRole(Role.LANDLORD);

        Property property = new Property();
        property.setLandlord(landlord);

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setTenant(tenant);
        booking.setProperty(property);
        booking.setStatus(BookingStatus.REQUESTED);

        when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(landlordId)).thenReturn(Optional.of(landlord));

        assertThrows(AccessDeniedException.class, () -> 
            bookingService.transition(bookingId, BookingStatus.CANCELLED, landlordId, null)
        );
    }

    @Test
    void testCannotMoveInUnlessPaidEscrow() {
        UUID tenantId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();

        User tenant = new User();
        tenant.setId(tenantId);

        Booking booking = new Booking();
        booking.setId(bookingId);
        booking.setTenant(tenant);
        booking.setProperty(new Property());
        booking.setStatus(BookingStatus.ACCEPTED); // Must be PAID_ESCROW

        when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        assertThrows(InvalidStateException.class, () -> 
            bookingService.transition(bookingId, BookingStatus.MOVED_IN, tenantId, null)
        );
    }

    @Test
    void testCreateBookingFailsIfPropertyNotAvailable() {
        UUID tenantId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();

        User tenant = new User();
        tenant.setId(tenantId);
        tenant.setRole(Role.TENANT);

        Property property = new Property();
        property.setId(propertyId);
        property.setStatus(PropertyStatus.RENTED);

        when(userRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));

        CreateBookingRequest request = new CreateBookingRequest();
        request.setPropertyId(propertyId);
        request.setMoveInDate(LocalDate.now().plusDays(5));
        request.setDurationMonths(12);

        assertThrows(InvalidStateException.class, () -> 
            bookingService.createBooking(request, tenantId)
        );
    }
}
