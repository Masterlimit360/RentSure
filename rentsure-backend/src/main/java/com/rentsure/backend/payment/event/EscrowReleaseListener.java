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
            // Important: This releases the Escrow automatically upon move-in confirmation.
            payment.setEscrowStatus(EscrowStatus.RELEASED);
            payment.setReleasedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Execute the physical transfer
            // We mock the recipient account as the landlord's user ID for this stub
            String landlordId = payment.getBooking().getProperty().getLandlord().getId().toString();
            transferService.transfer(landlordId, payment.getAmount(), payment.getPaystackRef());
            
            System.out.println("Escrow Released for Booking: " + bookingId);
        }
    }
}
