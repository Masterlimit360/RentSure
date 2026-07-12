package com.rentsure.backend.agreement.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.rentsure.backend.agreement.dto.AgreementDtos.AgreementDto;
import com.rentsure.backend.agreement.entity.Agreement;
import com.rentsure.backend.agreement.repository.AgreementRepository;
import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.common.storage.StorageService;
import com.rentsure.backend.payment.event.BookingPaidEvent;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgreementService {

    private final AgreementRepository agreementRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    /**
     * Listens for successful payment and automatically generates the agreement.
     * This decouples the core payment logic from the heavy PDF generation process.
     */
    @EventListener
    @Transactional
    public void handleBookingPaidEvent(BookingPaidEvent event) {
        try {
            generateAgreementForBooking(event.getBookingId());
        } catch (Exception e) {
            System.err.println("Failed to generate agreement for booking " + event.getBookingId());
            e.printStackTrace();
        }
    }

    private void generateAgreementForBooking(UUID bookingId) throws Exception {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (agreementRepository.findByBookingId(bookingId).isPresent()) {
            // Idempotency: Agreement already exists
            return;
        }

        // Generate simple HTML template
        String htmlContent = buildHtmlTemplate(booking);

        // Convert HTML to PDF using openhtmltopdf
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useFastMode();
        builder.withHtmlContent(htmlContent, null);
        builder.toStream(os);
        builder.run();

        byte[] pdfBytes = os.toByteArray();

        // Store the PDF bytes
        String pdfUrl = storageService.store(pdfBytes, "agreement_" + booking.getBookingRef() + ".pdf", "agreements");

        Agreement agreement = Agreement.builder()
                .booking(booking)
                .pdfUrl(pdfUrl)
                .build();

        agreementRepository.save(agreement);
    }

    @Transactional
    public AgreementDto signAgreement(UUID bookingId, UUID userId) {
        Agreement agreement = agreementRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new NotFoundException("Agreement not found"));

        User user = userRepository.findById(userId).orElseThrow();

        boolean isTenant = agreement.getBooking().getTenant().getId().equals(userId);
        boolean isLandlord = agreement.getBooking().getProperty().getLandlord().getId().equals(userId);

        if (!isTenant && !isLandlord) {
            throw new AccessDeniedException("You are not a party to this agreement");
        }

        if (isTenant) {
            if (agreement.getTenantSignedAt() != null) {
                throw new InvalidStateException("You have already signed this agreement");
            }
            agreement.setTenantSignedAt(LocalDateTime.now());
        } else {
            if (agreement.getLandlordSignedAt() != null) {
                throw new InvalidStateException("You have already signed this agreement");
            }
            agreement.setLandlordSignedAt(LocalDateTime.now());
        }

        agreementRepository.save(agreement);
        return mapToDto(agreement);
    }

    @Transactional(readOnly = true)
    public AgreementDto getAgreementByBookingId(UUID bookingId, UUID userId) {
        Agreement agreement = agreementRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new NotFoundException("Agreement not found"));

        boolean isTenant = agreement.getBooking().getTenant().getId().equals(userId);
        boolean isLandlord = agreement.getBooking().getProperty().getLandlord().getId().equals(userId);

        if (!isTenant && !isLandlord) {
            throw new AccessDeniedException("You are not a party to this agreement");
        }

        return mapToDto(agreement);
    }

    private String buildHtmlTemplate(Booking booking) {
        User landlord = booking.getProperty().getLandlord();
        User tenant = booking.getTenant();
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));

        return "<html><body>" +
                "<h1>Tenancy Agreement</h1>" +
                "<p><strong>Reference:</strong> " + booking.getBookingRef() + "</p>" +
                "<p><strong>Date:</strong> " + dateStr + "</p>" +
                "<hr/>" +
                "<h2>Parties</h2>" +
                "<p><strong>Landlord:</strong> " + landlord.getFullName() + " (" + landlord.getEmail() + ")</p>" +
                "<p><strong>Tenant:</strong> " + tenant.getFullName() + " (" + tenant.getEmail() + ")</p>" +
                "<h2>Property</h2>" +
                "<p><strong>Title:</strong> " + booking.getProperty().getTitle() + "</p>" +
                "<p><strong>Location:</strong> " + booking.getProperty().getArea() + ", " + booking.getProperty().getCity() + "</p>" +
                "<h2>Terms</h2>" +
                "<p><strong>Move-in Date:</strong> " + booking.getMoveInDate() + "</p>" +
                "<p><strong>Duration:</strong> " + booking.getDurationMonths() + " months</p>" +
                "<p><strong>Total Rent:</strong> GHS " + booking.getTotalAmount() + "</p>" +
                "<br/><br/><p>________________________<br/>Signatures applied electronically</p>" +
                "</body></html>";
    }

    private AgreementDto mapToDto(Agreement agreement) {
        AgreementDto dto = new AgreementDto();
        dto.setId(agreement.getId());
        dto.setBookingId(agreement.getBooking().getId());
        dto.setPdfUrl(agreement.getPdfUrl());
        dto.setTenantSignedAt(agreement.getTenantSignedAt());
        dto.setLandlordSignedAt(agreement.getLandlordSignedAt());
        return dto;
    }
}
