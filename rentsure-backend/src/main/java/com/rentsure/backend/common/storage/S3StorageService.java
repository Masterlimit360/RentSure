package com.rentsure.backend.common.storage;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Production storage service (e.g., AWS S3, Cloudflare R2).
 * Stubbed out for now.
 */
@Service
@Profile("prod")
public class S3StorageService implements StorageService {

    @Override
    public String store(MultipartFile file, String prefix) throws IOException {
        // IMPORTANT: In prod, implement AWS SDK or S3-compatible client here
        throw new UnsupportedOperationException("S3 Storage not fully implemented yet");
    }
}
