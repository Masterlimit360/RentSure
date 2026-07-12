package com.rentsure.backend.property.service;

import com.rentsure.backend.common.exception.InvalidStateException;
import com.rentsure.backend.common.exception.NotFoundException;
import com.rentsure.backend.common.storage.StorageService;
import com.rentsure.backend.property.entity.Property;
import com.rentsure.backend.property.entity.enums.MediaType;
import com.rentsure.backend.property.repository.PropertyMediaRepository;
import com.rentsure.backend.property.repository.PropertyRepository;
import com.rentsure.backend.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PropertyServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private PropertyMediaRepository propertyMediaRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private PropertyService propertyService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testOwnerOnlyAuthorizationForUpdate() {
        UUID propertyId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);

        Property property = new Property();
        property.setId(propertyId);
        property.setLandlord(owner);

        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));

        // Attempting update with otherUserId should throw AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> 
            propertyService.update(propertyId, null, otherUserId)
        );
    }

    @Test
    void testMediaValidation_PhotoTooLarge() throws IOException {
        UUID propertyId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);

        Property property = new Property();
        property.setId(propertyId);
        property.setLandlord(owner);

        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));

        // Create a fake file larger than 5MB
        byte[] largeContent = new byte[6 * 1024 * 1024]; 
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", largeContent);

        assertThrows(InvalidStateException.class, () -> 
            propertyService.uploadMedia(propertyId, ownerId, file, MediaType.PHOTO)
        );
    }

    @Test
    void testMediaValidation_InvalidMimeType() throws IOException {
        UUID propertyId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);

        Property property = new Property();
        property.setId(propertyId);
        property.setLandlord(owner);

        when(propertyRepository.findById(propertyId)).thenReturn(Optional.of(property));

        byte[] content = "fake gif".getBytes(); 
        MockMultipartFile file = new MockMultipartFile("file", "test.gif", "image/gif", content);

        assertThrows(InvalidStateException.class, () -> 
            propertyService.uploadMedia(propertyId, ownerId, file, MediaType.PHOTO)
        );
    }
}
