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

    /**
     * Stores raw bytes as a file.
     */
    String store(byte[] content, String filename, String prefix) throws IOException;

    /**
     * Generates a pre-signed, short-lived URL for accessing a private file.
     * @param filepath The full path/identifier of the file in storage
     * @param expiresInSeconds Number of seconds until the URL expires
     * @return The signed URL
     */
    default String getSignedUrl(String filepath, int expiresInSeconds) {
        throw new UnsupportedOperationException("Signed URLs not supported by this storage provider");
    }
}
