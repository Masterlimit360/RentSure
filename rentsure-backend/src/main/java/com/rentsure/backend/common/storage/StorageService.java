package com.rentsure.backend.common.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Pluggable storage abstraction for media files.
 */
public interface StorageService {
    /**
     * Stores a file and returns its public URL.
     * @param file The uploaded multipart file
     * @param prefix A logical folder or prefix (e.g., "properties", "agreements")
     * @return The absolute public URL where the file can be accessed
     */
    String store(MultipartFile file, String prefix) throws IOException;
}
