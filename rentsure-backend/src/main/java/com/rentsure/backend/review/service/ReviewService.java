package com.rentsure.backend.review.service;

import com.rentsure.backend.booking.entity.Booking;
import com.rentsure.backend.booking.entity.enums.BookingStatus;
import com.rentsure.backend.booking.repository.BookingRepository;
import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.review.dto.ReviewDtos.*;
import com.rentsure.backend.review.entity.Review;
import com.rentsure.backend.review.repository.ReviewRepository;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewDto createReview(CreateReviewRequest request, UUID reviewerId) {
        Booking booking = bookingRepository.findByIdForUpdate(request.getBookingId())
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.MOVED_IN && booking.getStatus() != BookingStatus.COMPLETED) {
            throw new InvalidStateException("You can only review after move-in");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        User reviewee;
        boolean isTenantReviewing = false;

        if (booking.getTenant().getId().equals(reviewerId)) {
            reviewee = booking.getProperty().getLandlord();
            isTenantReviewing = true;
        } else if (booking.getProperty().getLandlord().getId().equals(reviewerId)) {
            reviewee = booking.getTenant();
        } else {
            throw new AccessDeniedException("You are not a party to this booking");
        }

        if (reviewRepository.existsByBookingIdAndReviewerId(booking.getId(), reviewerId)) {
            throw new InvalidStateException("You have already reviewed this booking");
        }

        Review review = Review.builder()
                .booking(booking)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        reviewRepository.save(review);

        // If this is the first review by a tenant on a MOVED_IN booking, transition to COMPLETED.
        if (isTenantReviewing && booking.getStatus() == BookingStatus.MOVED_IN) {
            booking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(booking);
        }

        return mapToDto(review);
    }

    private ReviewDto mapToDto(Review review) {
        ReviewDto dto = new ReviewDto();
        dto.setId(review.getId());
        dto.setBookingId(review.getBooking().getId());
        dto.setReviewerId(review.getReviewer().getId());
        dto.setRevieweeId(review.getReviewee().getId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}
