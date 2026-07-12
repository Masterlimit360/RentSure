package com.rentsure.backend.booking.service;

import com.rentsure.backend.booking.dto.BookingDtos.*;
import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.event.BookingMovedInEvent;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.property.entity.Property;
import com.rentsure.backend.property.entity.enums.PropertyStatus;
import com.rentsure.backend.property.repository.PropertyRepository;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.entity.enums.Role;
import com.rentsure.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Booking Service - The core state machine of RentSure.
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    private final SecureRandom random = new SecureRandom();
    private static final String ALPHANUMERICS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    @Transactional
    public BookingDto createBooking(CreateBookingRequest request, UUID tenantId) {
        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new NotFoundException("Tenant not found"));
        
        if (tenant.getRole() != Role.TENANT) {
            throw new AccessDeniedException("Only tenants can request bookings");
        }

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new NotFoundException("Property not found"));

        if (property.getStatus() != PropertyStatus.AVAILABLE) {
            throw new InvalidStateException("Property is not available for booking");
        }

        boolean hasActive = bookingRepository.existsByTenantIdAndPropertyIdAndStatusIn(
                tenantId, property.getId(), 
                List.of(BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.PAID_ESCROW)
        );
        if (hasActive) {
            throw new InvalidStateException("You already have an active request for this property");
        }

        BigDecimal totalAmount = property.getPricePerYear()
                .divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP)
                .multiply(new BigDecimal(request.getDurationMonths()));

        Booking booking = Booking.builder()
                .property(property)
                .tenant(tenant)
                .status(BookingStatus.REQUESTED)
                .moveInDate(request.getMoveInDate())
                .durationMonths(request.getDurationMonths())
                .totalAmount(totalAmount)
                .bookingRef(generateUniqueRef())
                .build();

        bookingRepository.save(booking);
        return mapToDto(booking);
    }

    /**
     * Central state machine transition method.
     * Uses Pessimistic locking (SELECT FOR UPDATE) to serialize concurrent requests.
     */
    @Transactional
    public BookingDto transition(UUID bookingId, BookingStatus targetStatus, UUID actorId, String reason) {
        // IMPORTANT: findByIdForUpdate blocks until any concurrent transaction finishes.
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        validateTransition(booking, targetStatus, actor);

        booking.setStatus(targetStatus);
        
        if (targetStatus == BookingStatus.REJECTED) {
            booking.setRejectReason(reason);
        }

        bookingRepository.save(booking);

        if (targetStatus == BookingStatus.MOVED_IN) {
            eventPublisher.publishEvent(new BookingMovedInEvent(this, booking.getId()));
        }

        return mapToDto(booking);
    }

    private void validateTransition(Booking booking, BookingStatus targetStatus, User actor) {
        BookingStatus current = booking.getStatus();
        boolean isTenant = actor.getId().equals(booking.getTenant().getId());
        boolean isLandlord = actor.getId().equals(booking.getProperty().getLandlord().getId());
        
        if (!isTenant && !isLandlord && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You are not a party to this booking");
        }

        switch (targetStatus) {
            case ACCEPTED:
                if (current != BookingStatus.REQUESTED) throw new InvalidStateException("Cannot accept: booking is " + current);
                if (!isLandlord) throw new AccessDeniedException("Only the landlord can accept a booking");
                break;
                
            case REJECTED:
                if (current != BookingStatus.REQUESTED) throw new InvalidStateException("Cannot reject: booking is " + current);
                if (!isLandlord) throw new AccessDeniedException("Only the landlord can reject a booking");
                break;
                
            case CANCELLED:
                if (current != BookingStatus.REQUESTED) throw new InvalidStateException("Cannot cancel: booking is " + current);
                if (!isTenant) throw new AccessDeniedException("Only the tenant can cancel their request");
                break;

            case PAID_ESCROW:
                if (current != BookingStatus.ACCEPTED) throw new InvalidStateException("Cannot pay: booking is " + current);
                // In reality, this transition is triggered by a webhook from the payment service
                break;

            case MOVED_IN:
                if (current != BookingStatus.PAID_ESCROW) throw new InvalidStateException("Cannot move in: booking is " + current);
                if (!isTenant) throw new AccessDeniedException("Only the tenant can confirm move-in");
                break;

            case COMPLETED:
                if (current != BookingStatus.MOVED_IN) throw new InvalidStateException("Cannot complete: booking is " + current);
                // Triggered automatically by Review system, or by Admin.
                break;
                
            case EXPIRED:
                // Triggered by scheduled job
                break;

            default:
                throw new InvalidStateException("Unknown transition target: " + targetStatus);
        }
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getMyBookings(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
                
        List<Booking> bookings;
        if (user.getRole() == Role.TENANT) {
            bookings = bookingRepository.findByTenantId(userId);
        } else if (user.getRole() == Role.LANDLORD) {
            bookings = bookingRepository.findByProperty_Landlord_Id(userId);
        } else {
            bookings = List.of();
        }
        
        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void expireStaleBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(72);
        int expiredCount = bookingRepository.expireStaleBookings(cutoff);
        if (expiredCount > 0) {
            System.out.println("Expired " + expiredCount + " stale accepted bookings.");
        }
    }

    private String generateUniqueRef() {
        while (true) {
            StringBuilder sb = new StringBuilder("RS-");
            for (int i = 0; i < 6; i++) {
                sb.append(ALPHANUMERICS.charAt(random.nextInt(ALPHANUMERICS.length())));
            }
            String ref = sb.toString();
            if (!bookingRepository.existsByBookingRef(ref)) {
                return ref;
            }
        }
    }

    private BookingDto mapToDto(Booking booking) {
        BookingDto dto = new BookingDto();
        dto.setId(booking.getId());
        dto.setPropertyId(booking.getProperty().getId());
        dto.setTenantId(booking.getTenant().getId());
        dto.setStatus(booking.getStatus());
        dto.setRequestedAt(booking.getRequestedAt());
        dto.setMoveInDate(booking.getMoveInDate());
        dto.setDurationMonths(booking.getDurationMonths());
        dto.setTotalAmount(booking.getTotalAmount());
        dto.setBookingRef(booking.getBookingRef());
        dto.setRejectReason(booking.getRejectReason());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }
}
