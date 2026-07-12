package com.rentsure.backend.payment.event;

import com.rentsure.backend.booking.event.BookingMovedInEvent;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.payment.entity.Payment;
import com.rentsure.backend.payment.entity.enums.EscrowStatus;
import com.rentsure.backend.payment.repository.PaymentRepository;
import com.rentsure.backend.payment.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Automated Escrow Release Mechanism.
 * Listens for Tenant move-in confirmation and automatically triggers the funds transfer to the Landlord.
 */
@Component
@RequiredArgsConstructor
public class EscrowReleaseListener {

    private final PaymentRepository paymentRepository;
    private final TransferService transferService;

    @EventListener
    @Transactional
    public void handleBookingMovedInEvent(BookingMovedInEvent event) {
        UUID bookingId = event.getBookingId();
        
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new NotFoundException("Payment not found for booking " + bookingId));

        if (payment.getEscrowStatus() == EscrowStatus.HELD) {
            // IMPORTANT: Escrow release must be automatic on move-in to ensure landlords are paid without manual intervention.
            payment.setEscrowStatus(EscrowStatus.RELEASED);
            payment.setReleasedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // We mock the recipient account as the landlord's user ID for this stub
            String landlordId = payment.getBooking().getProperty().getLandlord().getId().toString();
            transferService.transfer(landlordId, payment.getAmount(), payment.getPaystackRef());
        }
    }
}
