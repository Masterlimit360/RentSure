package com.rentsure.backend.review.controller;

import com.rentsure.backend.common.ApiResponse;
import com.rentsure.backend.review.dto.ReviewDtos.*;
import com.rentsure.backend.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ApiResponse<ReviewDto> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication) {
        UUID reviewerId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(reviewService.createReview(request, reviewerId));
    }
}
