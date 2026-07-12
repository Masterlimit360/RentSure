package com.rentsure.backend.property.controller;

import com.rentsure.backend.common.ApiResponse;
import com.rentsure.backend.property.dto.PropertyDtos.*;
import com.rentsure.backend.property.entity.enums.MediaType;
import com.rentsure.backend.property.entity.enums.PropertyType;
import com.rentsure.backend.property.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    public ApiResponse<PaginatedResponse<PropertyDto>> getProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        UUID requesterId = null;
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            requesterId = UUID.fromString((String) authentication.getPrincipal());
        }

        return ApiResponse.success(propertyService.search(city, type, minPrice, maxPrice, page, size, requesterId));
    }

    @GetMapping("/{id}")
    public ApiResponse<PropertyDto> getPropertyById(@PathVariable UUID id) {
        return ApiResponse.success(propertyService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('LANDLORD')")
    public ApiResponse<PropertyDto> createProperty(
            @Valid @RequestBody CreatePropertyRequest request,
            Authentication authentication) {
        UUID landlordId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(propertyService.create(request, landlordId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LANDLORD')")
    public ApiResponse<PropertyDto> updateProperty(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePropertyRequest request,
            Authentication authentication) {
        UUID landlordId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(propertyService.update(id, request, landlordId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LANDLORD')")
    public ApiResponse<Void> deleteProperty(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID landlordId = UUID.fromString((String) authentication.getPrincipal());
        propertyService.delete(id, landlordId);
        return ApiResponse.success(null);
    }

    @PostMapping(value = "/{id}/media", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('LANDLORD')")
    public ApiResponse<PropertyMediaDto> uploadMedia(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("mediaType") com.rentsure.backend.property.entity.enums.MediaType mediaType,
            Authentication authentication) throws IOException {
        UUID landlordId = UUID.fromString((String) authentication.getPrincipal());
        return ApiResponse.success(propertyService.uploadMedia(id, landlordId, file, mediaType));
    }
}
