package com.rentsure.backend.property.repository;

import com.rentsure.backend.property.entity.PropertyMedia;
import com.rentsure.backend.property.entity.enums.MediaType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyMediaRepository extends JpaRepository<PropertyMedia, UUID> {
    List<PropertyMedia> findByPropertyId(UUID propertyId);
    long countByPropertyIdAndMediaType(UUID propertyId, MediaType mediaType);
}
