package com.rentsure.backend.property.dto;

import com.rentsure.backend.property.entity.enums.PropertyStatus;
import com.rentsure.backend.property.entity.enums.PropertyType;
import com.rentsure.backend.property.entity.enums.MediaType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class PropertyDtos {

    @Data
    public static class CreatePropertyRequest {
        @NotBlank
        private String title;
        @NotBlank
        private String description;
        @NotNull
        private PropertyType propertyType;
        @NotBlank
        private String region;
        @NotBlank
        private String city;
        @NotBlank
        private String area;
        
        @NotNull
        private BigDecimal gpsLat;
        @NotNull
        private BigDecimal gpsLng;
        
        @NotNull
        @Min(1)
        private BigDecimal pricePerYear;
        
        @NotNull
        @Min(1)
        private Integer bedrooms;
        
        @NotNull
        @Min(0)
        private Integer bathrooms;
        
        private List<String> amenities;
    }

    @Data
    public static class UpdatePropertyRequest {
        private String title;
        private String description;
        private PropertyType propertyType;
        private String region;
        private String city;
        private String area;
        private BigDecimal gpsLat;
        private BigDecimal gpsLng;
        @Min(1)
        private BigDecimal pricePerYear;
        @Min(1)
        private Integer bedrooms;
        @Min(0)
        private Integer bathrooms;
        private List<String> amenities;
    }

    @Data
    public static class PropertyMediaDto {
        private UUID id;
        private MediaType mediaType;
        private String url;
        private Integer sortOrder;
    }

    @Data
    public static class PropertyDto {
        private UUID id;
        private UUID landlordId;
        private String title;
        private String description;
        private PropertyType propertyType;
        private String region;
        private String city;
        private String area;
        private BigDecimal gpsLat;
        private BigDecimal gpsLng;
        private BigDecimal pricePerYear;
        private Integer bedrooms;
        private Integer bathrooms;
        private List<String> amenities;
        private boolean isVerified;
        private PropertyStatus status;
        private List<PropertyMediaDto> media;
        private LocalDateTime createdAt;
    }

    @Data
    public static class PaginatedResponse<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
    }
}
