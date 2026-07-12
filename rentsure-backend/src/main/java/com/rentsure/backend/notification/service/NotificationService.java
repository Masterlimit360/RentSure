package com.rentsure.backend.notification.service;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.event.BookingMovedInEvent;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.notification.dto.NotificationDtos.NotificationDto;
import com.rentsure.backend.notification.entity.Notification;
import com.rentsure.backend.notification.repository.NotificationRepository;
import com.rentsure.backend.payment.event.BookingPaidEvent;
import com.rentsure.backend.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Central Notification dispatcher.
 * Converts system events into user-facing alerts in the database.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;

    /**
     * Dispatches payment success notifications to both parties.
     */
    @EventListener
    @Transactional
    public void handleBookingPaid(BookingPaidEvent event) {
        Booking booking = bookingRepository.findById(event.getBookingId()).orElseThrow();
        createNotification(
                booking.getProperty().getLandlord(),
                "PAYMENT_RECEIVED",
                "Payment Received",
                "Tenant has paid GHS " + booking.getTotalAmount() + " for " + booking.getProperty().getTitle() + ". Funds are securely held in escrow."
        );

        createNotification(
                booking.getTenant(),
                "PAYMENT_SUCCESS",
                "Payment Successful",
                "Your payment of GHS " + booking.getTotalAmount() + " was successful. Your tenancy agreement is ready to sign."
        );
    }

    /**
     * Dispatches escrow release notifications to the landlord.
     */
    @EventListener
    @Transactional
    public void handleBookingMovedIn(BookingMovedInEvent event) {
        Booking booking = bookingRepository.findById(event.getBookingId()).orElseThrow();

        // Notify Landlord
        createNotification(
                booking.getProperty().getLandlord(),
                "ESCROW_RELEASED",
                "Escrow Released",
                "The tenant has confirmed move-in for " + booking.getProperty().getTitle() + ". Escrow funds are being released to your payout account."
        );
    }

    private void createNotification(User user, String type, String title, String body) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Fetches paginated notifications for the calling user.
     */
    @Transactional(readOnly = true)
    public Page<NotificationDto> getMyNotifications(UUID userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::mapToDto);
    }

    /**
     * Marks a notification as read.
     * Preconditions: The notification must belong to the caller.
     * @throws AccessDeniedException if caller does not own the notification
     */
    @Transactional
    public NotificationDto markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("This notification does not belong to you");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
        return mapToDto(notification);
    }

    private NotificationDto mapToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setUserId(notification.getUser().getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setBody(notification.getBody());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}
