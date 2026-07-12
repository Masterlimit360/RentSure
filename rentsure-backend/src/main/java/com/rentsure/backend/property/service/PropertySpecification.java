package com.rentsure.backend.property.service;

import com.rentsure.backend.property.entity.Property;
import com.rentsure.backend.property.entity.enums.PropertyStatus;
import com.rentsure.backend.property.entity.enums.PropertyType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Builds dynamic JPA queries for property filtering.
 */
public class PropertySpecification {

    public static Specification<Property> hasCity(String city) {
        return (root, query, cb) -> 
            city == null ? null : cb.equal(cb.lower(root.get("city")), city.toLowerCase());
    }

    public static Specification<Property> hasType(PropertyType type) {
        return (root, query, cb) -> 
            type == null ? null : cb.equal(root.get("propertyType"), type);
    }

    public static Specification<Property> priceGreaterThanOrEq(BigDecimal minPrice) {
        return (root, query, cb) -> 
            minPrice == null ? null : cb.greaterThanOrEqualTo(root.get("pricePerYear"), minPrice);
    }

    public static Specification<Property> priceLessThanOrEq(BigDecimal maxPrice) {
        return (root, query, cb) -> 
            maxPrice == null ? null : cb.lessThanOrEqualTo(root.get("pricePerYear"), maxPrice);
    }

    public static Specification<Property> isAvailableOrOwnedBy(UUID landlordId) {
        return (root, query, cb) -> {
            var statusAvailable = cb.equal(root.get("status"), PropertyStatus.AVAILABLE);
            if (landlordId == null) {
                return statusAvailable;
            } else {
                var isOwner = cb.equal(root.get("landlord").get("id"), landlordId);
                return cb.or(statusAvailable, isOwner);
            }
        };
    }
}
