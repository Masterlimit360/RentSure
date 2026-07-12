package com.rentsure.backend.property.service;

import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.common.storage.StorageService;
import com.rentsure.backend.property.dto.PropertyDtos.*;
import com.rentsure.backend.property.entity.Property;
import com.rentsure.backend.property.entity.PropertyMedia;
import com.rentsure.backend.property.entity.enums.MediaType;
import com.rentsure.backend.property.entity.enums.PropertyStatus;
import com.rentsure.backend.property.entity.enums.PropertyType;
import com.rentsure.backend.property.repository.PropertyMediaRepository;
import com.rentsure.backend.property.repository.PropertyRepository;
import com.rentsure.backend.user.entity.User;
import com.rentsure.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Orchestrates all Property-related business logic.
 * Enforces ownership rules for mutations and validates media uploads.
 */
@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyMediaRepository propertyMediaRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    // IMPORTANT: Hard limits to prevent storage abuse
    private static final long MAX_PHOTOS = 10;
    private static final long MAX_VIDEOS = 2;
    private static final long MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    private static final long MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

    /**
     * Searches properties using dynamic filters.
     * Preconditions: Non-landlords only see AVAILABLE properties. Landlords see their own + AVAILABLE.
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<PropertyDto> search(
            String query, String city, PropertyType type, BigDecimal minPrice, BigDecimal maxPrice, 
            int page, int size, UUID requesterId) {

        // Default bounds: min 1, max 50
        page = Math.max(0, page);
        size = Math.min(50, Math.max(1, size));
        Pageable pageable = PageRequest.of(page, size);

        Specification<Property> spec = Specification.where(PropertySpecification.matchesQuery(query))
                .and(PropertySpecification.hasCity(city))
                .and(PropertySpecification.hasType(type))
                .and(PropertySpecification.priceGreaterThanOrEq(minPrice))
                .and(PropertySpecification.priceLessThanOrEq(maxPrice))
                .and(PropertySpecification.isAvailableOrOwnedBy(requesterId));

        Page<Property> resultPage = propertyRepository.findAll(spec, pageable);

        PaginatedResponse<PropertyDto> response = new PaginatedResponse<>();
        response.setContent(resultPage.getContent().stream().map(this::mapToDto).collect(Collectors.toList()));
        response.setPage(resultPage.getNumber());
        response.setSize(resultPage.getSize());
        response.setTotalElements(resultPage.getTotalElements());
        response.setTotalPages(resultPage.getTotalPages());

        return response;
    }

    @Transactional(readOnly = true)
    public PropertyDto getById(UUID id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Property not found"));
        return mapToDto(property);
    }

    /**
     * Creates a new property listing.
     * Preconditions: Requester must be a LANDLORD (enforced via Security context).
     */
    @Transactional
    public PropertyDto create(CreatePropertyRequest request, UUID landlordId) {
        User landlord = userRepository.findById(landlordId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Property property = Property.builder()
                .landlord(landlord)
                .title(request.getTitle())
                .description(request.getDescription())
                .propertyType(request.getPropertyType())
                .region(request.getRegion())
                .city(request.getCity())
                .area(request.getArea())
                .gpsLat(request.getGpsLat())
                .gpsLng(request.getGpsLng())
                .pricePerYear(request.getPricePerYear())
                .bedrooms(request.getBedrooms())
                .bathrooms(request.getBathrooms())
                .amenities(request.getAmenities() != null ? request.getAmenities() : List.of())
                .isVerified(false)
                .status(PropertyStatus.AVAILABLE)
                .build();

        propertyRepository.save(property);
        return mapToDto(property);
    }

    /**
     * Updates a property.
     * Preconditions: Requester must be the owner of the property.
     * Throws: AccessDeniedException if someone else tries to update.
     */
    @Transactional
    public PropertyDto update(UUID propertyId, UpdatePropertyRequest request, UUID landlordId) {
        Property property = getOwnedProperty(propertyId, landlordId);

        if (request.getTitle() != null) property.setTitle(request.getTitle());
        if (request.getDescription() != null) property.setDescription(request.getDescription());
        if (request.getPropertyType() != null) property.setPropertyType(request.getPropertyType());
        if (request.getRegion() != null) property.setRegion(request.getRegion());
        if (request.getCity() != null) property.setCity(request.getCity());
        if (request.getArea() != null) property.setArea(request.getArea());
        if (request.getGpsLat() != null) property.setGpsLat(request.getGpsLat());
        if (request.getGpsLng() != null) property.setGpsLng(request.getGpsLng());
        if (request.getPricePerYear() != null) property.setPricePerYear(request.getPricePerYear());
        if (request.getBedrooms() != null) property.setBedrooms(request.getBedrooms());
        if (request.getBathrooms() != null) property.setBathrooms(request.getBathrooms());
        if (request.getAmenities() != null) property.setAmenities(request.getAmenities());

        propertyRepository.save(property);
        return mapToDto(property);
    }

    /**
     * Soft-deletes a property by hiding it.
     * Preconditions: Requester must be the owner.
     */
    @Transactional
    public void delete(UUID propertyId, UUID landlordId) {
        Property property = getOwnedProperty(propertyId, landlordId);
        property.setStatus(PropertyStatus.HIDDEN);
        propertyRepository.save(property);
    }

    /**
     * Uploads media and attaches it to the property.
     * Validates MIME type whitelist, file size, and enforces max caps per property.
     * Preconditions: Requester must be owner.
     */
    @Transactional
    public PropertyMediaDto uploadMedia(UUID propertyId, UUID landlordId, MultipartFile file, MediaType mediaType) throws IOException {
        Property property = getOwnedProperty(propertyId, landlordId);

        validateMediaFile(file, mediaType);

        long currentCount = propertyMediaRepository.countByPropertyIdAndMediaType(propertyId, mediaType);
        if (mediaType == MediaType.PHOTO && currentCount >= MAX_PHOTOS) {
            throw new InvalidStateException("Maximum limit of " + MAX_PHOTOS + " photos reached.");
        }
        if (mediaType == MediaType.VIDEO && currentCount >= MAX_VIDEOS) {
            throw new InvalidStateException("Maximum limit of " + MAX_VIDEOS + " videos reached.");
        }

        String publicUrl = storageService.store(file, "prop_" + propertyId);

        PropertyMedia media = PropertyMedia.builder()
                .property(property)
                .mediaType(mediaType)
                .url(publicUrl)
                .sortOrder((int) currentCount + 1)
                .build();

        propertyMediaRepository.save(media);
        return mapMediaToDto(media);
    }

    // IMPORTANT: Owner-only authorization check
    private Property getOwnedProperty(UUID propertyId, UUID landlordId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property not found"));
        if (!property.getLandlord().getId().equals(landlordId)) {
            throw new AccessDeniedException("You can only modify your own properties");
        }
        return property;
    }

    private void validateMediaFile(MultipartFile file, MediaType mediaType) {
        if (file.isEmpty()) throw new InvalidStateException("File is empty");

        String contentType = file.getContentType();
        long size = file.getSize();

        if (mediaType == MediaType.PHOTO) {
            if (contentType == null || !contentType.matches("image/(jpeg|png|webp)")) {
                throw new InvalidStateException("Only JPEG, PNG, and WebP are allowed for photos");
            }
            if (size > MAX_PHOTO_SIZE_BYTES) {
                throw new InvalidStateException("Photo exceeds maximum size of 5MB");
            }
        } else if (mediaType == MediaType.VIDEO) {
            if (contentType == null || !contentType.equals("video/mp4")) {
                throw new InvalidStateException("Only MP4 is allowed for videos");
            }
            if (size > MAX_VIDEO_SIZE_BYTES) {
                throw new InvalidStateException("Video exceeds maximum size of 50MB");
            }
        }
    }

    private PropertyDto mapToDto(Property property) {
        PropertyDto dto = new PropertyDto();
        dto.setId(property.getId());
        dto.setLandlordId(property.getLandlord().getId());
        dto.setTitle(property.getTitle());
        dto.setDescription(property.getDescription());
        dto.setPropertyType(property.getPropertyType());
        dto.setRegion(property.getRegion());
        dto.setCity(property.getCity());
        dto.setArea(property.getArea());
        dto.setGpsLat(property.getGpsLat());
        dto.setGpsLng(property.getGpsLng());
        dto.setPricePerYear(property.getPricePerYear());
        dto.setBedrooms(property.getBedrooms());
        dto.setBathrooms(property.getBathrooms());
        dto.setAmenities(property.getAmenities());
        dto.setVerified(property.isVerified());
        dto.setStatus(property.getStatus());
        
        List<PropertyMedia> mediaList = propertyMediaRepository.findByPropertyId(property.getId());
        dto.setMedia(mediaList.stream().map(this::mapMediaToDto).collect(Collectors.toList()));
        
        dto.setCreatedAt(property.getCreatedAt());
        return dto;
    }

    private PropertyMediaDto mapMediaToDto(PropertyMedia media) {
        PropertyMediaDto dto = new PropertyMediaDto();
        dto.setId(media.getId());
        dto.setMediaType(media.getMediaType());
        dto.setUrl(media.getUrl());
        dto.setSortOrder(media.getSortOrder());
        return dto;
    }
}
