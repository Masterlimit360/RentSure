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
 * Payment and Escrow orchestration.
 * Handles Paystack checkout generation and acts as the sole source of truth for Webhook processing.
 * Never bypass this service to manually update payment rows, or idempotency and escrow rules will break.
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
     * Prepares a Paystack checkout session for an accepted booking.
     * Preconditions: Booking is ACCEPTED, caller is the specific tenant on the booking.
     * @throws AccessDeniedException if caller is not the tenant
     * @throws InvalidStateException if booking is not ACCEPTED or Paystack API fails
     */
    @Transactional
    public PaymentInitializationResponse initializePayment(UUID bookingId, User tenant) {
        if (tenant.getRole() != Role.TENANT) {
            throw new AccessDeniedException("Only tenants can initialize rent payment");
        }

        // Pessimistic lock: prevents multiple init attempts from racing and charging the tenant twice
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (!booking.getTenant().getId().equals(tenant.getId())) {
            throw new AccessDeniedException("You are not the tenant of this booking");
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new InvalidStateException("Booking is not in ACCEPTED state");
        }

        Optional<Payment> existingOpt = paymentRepository.findByBookingId(booking.getId());

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

        // We defer saving the Payment row until the webhook fires to avoid polluting the DB with abandoned checkout sessions.
        
        PaymentInitializationResponse res = new PaymentInitializationResponse();
        res.setCheckoutUrl(response.getData().getAuthorization_url());
        res.setAccessCode(response.getData().getAccess_code());
        res.setReference(response.getData().getReference());

        return res;
    }

    /**
     * Webhook processor for Paystack events. 
     * Preconditions: Signature must be validated by the controller before calling this.
     * @throws InvalidStateException if the charged amount does not strictly match expected rent + fee
     */
    @Transactional
    public void handleWebhook(String event, String reference, BigDecimal amountInPesewas, String statusStr, String bookingIdStr) {
        if (!"charge.success".equals(event) || !"success".equals(statusStr)) {
            return;
        }

        // IMPORTANT: Webhook idempotency. Paystack retries hooks; if we process twice, the state machine will crash.
        Optional<Payment> existingPayment = paymentRepository.findByPaystackRef(reference);
        if (existingPayment.isPresent()) {
            return;
        }

        UUID bookingId = UUID.fromString(bookingIdStr);
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found from webhook metadata"));

        BigDecimal expectedTotal = booking.getTotalAmount().add(booking.getTotalAmount().multiply(FEE_PERCENTAGE));
        BigDecimal expectedPesewas = expectedTotal.multiply(new BigDecimal("100"));

        if (amountInPesewas.compareTo(expectedPesewas) != 0) {
            // Protects against users tampering with the client-side checkout amount payload
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

        bookingService.transition(booking.getId(), BookingStatus.PAID_ESCROW, booking.getTenant().getId(), null);

        // Triggers automated PDF agreement generation and user notifications
        eventPublisher.publishEvent(new com.rentsure.backend.payment.event.BookingPaidEvent(this, booking.getId()));
    }

    /**
     * Retrieves the escrow status of a booking's payment.
     * Preconditions: A payment must exist for the booking.
     * @throws NotFoundException if no payment is recorded yet
     */

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
