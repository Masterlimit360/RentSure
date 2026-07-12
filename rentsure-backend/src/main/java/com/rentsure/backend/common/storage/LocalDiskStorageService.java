package com.rentsure.backend.common.storage;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Dev-only storage service that saves files to a local directory.
 */
@Service
@Profile("dev")
public class LocalDiskStorageService implements StorageService {

    @Value("${app.storage.local-dir:./media}")
    private String baseDir;

    @Value("${app.storage.base-url:http://localhost:8080/media}")
    private String baseUrl;

    @PostConstruct
    public void init() throws IOException {
        Path path = Paths.get(baseDir);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }
    }

    @Override
    public String store(MultipartFile file, String prefix) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String newFilename = prefix + "_" + UUID.randomUUID() + extension;
        Path targetLocation = Paths.get(baseDir).resolve(newFilename);
        
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        
        return baseUrl + "/" + newFilename;
    }

    @Override
    public String store(byte[] content, String filename, String prefix) throws IOException {
        String extension = "";
        if (filename != null && filename.contains(".")) {
            extension = filename.substring(filename.lastIndexOf("."));
        }

        String newFilename = prefix + "_" + UUID.randomUUID() + extension;
        Path targetLocation = Paths.get(baseDir).resolve(newFilename);
        
        Files.write(targetLocation, content);
        
        return baseUrl + "/" + newFilename;
    }
}
