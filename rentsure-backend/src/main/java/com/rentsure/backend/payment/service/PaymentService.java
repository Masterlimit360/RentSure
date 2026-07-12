package com.rentsure.backend.payment.service;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.booking.service.BookingService;
import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.payment.client.PaystackClient;
import com.rentsure.backend.payment.dto.PaymentDtos.PaymentInitializationResponse;
import com.rentsure.backend.payment.dto.PaymentDtos.PaymentStatusDto;
import com.rentsure.backend.payment.entity.Payment;
import com.rentsure.backend.payment.entity.enums.EscrowStatus;
import com.rentsure.backend.payment.repository.PaymentRepository;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.entity.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * Orchestrates Paystack payments, escrow holding, and webhook processing.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PaystackClient paystackClient;
    private final BookingService bookingService;
    private final ApplicationEventPublisher eventPublisher;

    private static final BigDecimal FEE_PERCENTAGE = new BigDecimal("0.05");

    /**
     * Initializes a Paystack transaction.
     * Preconditions: Booking must be ACCEPTED, caller must be the tenant.
     */
    @Transactional
    public PaymentInitializationResponse initializePayment(UUID bookingId, User tenant) {
        if (tenant.getRole() != Role.TENANT) {
            throw new AccessDeniedException("Only tenants can initialize rent payment");
        }

        // We use a pessimistic lock here just in case of multiple simultaneous init attempts
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (!booking.getTenant().getId().equals(tenant.getId())) {
            throw new AccessDeniedException("You are not the tenant of this booking");
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new InvalidStateException("Booking is not in ACCEPTED state");
        }

        // If payment already exists for this booking, we could re-use or reject.
        // We'll just generate a new reference and update if it's not yet HELD.
        Optional<Payment> existingOpt = paymentRepository.findByBookingId(booking.getId());
        if (existingOpt.isPresent() && existingOpt.get().getEscrowStatus() != EscrowStatus.REFUNDED) {
             // Let the frontend handle the re-try via the previously generated url, or just overwrite.
             // We'll just continue and generate a new one.
        }

        BigDecimal rentAmount = booking.getTotalAmount();
        BigDecimal fee = rentAmount.multiply(FEE_PERCENTAGE);
        BigDecimal totalPayable = rentAmount.add(fee);

        // IMPORTANT: Paystack sends amounts in pesewas, so multiply GHS by 100 before initializing
        BigDecimal totalPesewas = totalPayable.multiply(new BigDecimal("100"));

        String reference = "PAY-" + UUID.randomUUID().toString().substring(0, 8);

        PaystackClient.PaystackInitializationResponse response = 
                paystackClient.initializeTransaction(tenant.getEmail(), totalPesewas, reference, booking.getId().toString());

        if (!response.isStatus()) {
            throw new InvalidStateException("Failed to initialize Paystack: " + response.getMessage());
        }

        Payment payment = existingOpt.orElse(new Payment());
        payment.setBooking(booking);
        payment.setPaystackRef(reference);
        payment.setAmount(totalPayable);
        payment.setFee(fee);
        // It's pending technically, but we don't have a PENDING status. It only gets created in DB.
        // Let's actually not save it until webhook, or save with a flag? Wait, schema has paid_at default now.
        // Actually, we can just save it when the webhook hits, but we need it to track the reference.
        // Since schema says escrow_status NOT NULL, let's just use HELD but it's not actually paid yet.
        // Actually we need to track if it's paid. The Flyway doesn't have PENDING.
        // I will just wait to create the Payment row inside the Webhook! This avoids dirty pending rows.
        // But what if we need to verify? We can just verify via the Paystack API directly.
        
        PaymentInitializationResponse res = new PaymentInitializationResponse();
        res.setCheckoutUrl(response.getData().getAuthorization_url());
        res.setAccessCode(response.getData().getAccess_code());
        res.setReference(response.getData().getReference());

        return res;
    }

    /**
     * Processes Paystack webhooks safely.
     * Includes idempotency and amount-matching verification.
     */
    @Transactional
    public void handleWebhook(String event, String reference, BigDecimal amountInPesewas, String statusStr, String bookingIdStr) {
        if (!"charge.success".equals(event) || !"success".equals(statusStr)) {
            return; // Ignore other events
        }

        // 1. Idempotency Check
        Optional<Payment> existingPayment = paymentRepository.findByPaystackRef(reference);
        if (existingPayment.isPresent()) {
            // Already processed this webhook successfully.
            return;
        }

        UUID bookingId = UUID.fromString(bookingIdStr);
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found from webhook metadata"));

        BigDecimal expectedTotal = booking.getTotalAmount().add(booking.getTotalAmount().multiply(FEE_PERCENTAGE));
        BigDecimal expectedPesewas = expectedTotal.multiply(new BigDecimal("100"));

        if (amountInPesewas.compareTo(expectedPesewas) != 0) {
            // Amount mismatch. Log this heavily. In production, we'd refund or flag for manual review.
            throw new InvalidStateException("Webhook amount mismatch! Expected: " + expectedPesewas + " Got: " + amountInPesewas);
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .paystackRef(reference)
                .amount(expectedTotal)
                .fee(booking.getTotalAmount().multiply(FEE_PERCENTAGE))
                .escrowStatus(EscrowStatus.HELD)
                .build();

        paymentRepository.save(payment);

        // Transition booking to PAID_ESCROW
        // This validates the state machine internally
        bookingService.transition(booking.getId(), BookingStatus.PAID_ESCROW, booking.getTenant().getId(), null);

        // Notify system that payment happened (for Agreements and Notifications)
        eventPublisher.publishEvent(new com.rentsure.backend.payment.event.BookingPaidEvent(this, booking.getId()));
    }

    @Transactional(readOnly = true)
    public PaymentStatusDto getPaymentStatus(UUID bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new NotFoundException("Payment not found for this booking"));

        PaymentStatusDto dto = new PaymentStatusDto();
        dto.setBookingId(payment.getBooking().getId());
        dto.setPaystackRef(payment.getPaystackRef());
        dto.setAmount(payment.getAmount());
        dto.setEscrowStatus(payment.getEscrowStatus());
        dto.setPaidAt(payment.getPaidAt());
        dto.setReleasedAt(payment.getReleasedAt());
        return dto;
    }
}
