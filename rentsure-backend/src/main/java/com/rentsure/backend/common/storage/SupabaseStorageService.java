package com.rentsure.backend.common.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Supabase Storage integration for uploading files directly to a Supabase bucket.
 * Supports public property media and private verification documents.
 */
@Service
@Primary
public class SupabaseStorageService implements StorageService {

    @Value("${app.storage.supabase.url:https://nxujvinvafvfsavdlqwj.supabase.co}")
    private String supabaseUrl;

    @Value("${app.storage.supabase.anon-key:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54dWp2aW52YWZ2ZnNhdmRscXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTgxNTgsImV4cCI6MjA5OTQzNDE1OH0.Veu006UvNDlbxf9tiQd9cuwap3HebE2mRTxgibJFuUE}")
    private String supabaseKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String getBucketName(String prefix) {
        if (prefix != null && prefix.toLowerCase().contains("verification")) {
            return "verification-docs";
        }
        return "property-media";
    }

    @Override
    public String store(MultipartFile file, String prefix) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String newFilename = prefix + "_" + UUID.randomUUID() + extension;
        String bucket = getBucketName(prefix);

        return uploadToSupabase(file.getBytes(), newFilename, file.getContentType(), bucket);
    }

    @Override
    public String store(byte[] content, String filename, String prefix) throws IOException {
        String extension = "";
        if (filename != null && filename.contains(".")) {
            extension = filename.substring(filename.lastIndexOf("."));
        }
        String newFilename = prefix + "_" + UUID.randomUUID() + extension;
        String bucket = getBucketName(prefix);

        String contentType = extension.equalsIgnoreCase(".pdf") ? "application/pdf" : "application/octet-stream";
        
        return uploadToSupabase(content, newFilename, contentType, bucket);
    }

    @Override
    public String getSignedUrl(String filepath, int expiresInSeconds) {
        // filepath is expected to be the filename stored in the verification-docs bucket
        String bucket = "verification-docs";
        String url = String.format("%s/storage/v1/object/sign/%s/%s", supabaseUrl, bucket, filepath);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.set("Content-Type", "application/json");

        Map<String, Object> body = new HashMap<>();
        body.put("expiresIn", expiresInSeconds);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String signedUrlPath = root.path("signedURL").asText();
                return supabaseUrl + signedUrlPath;
            } else {
                throw new RuntimeException("Failed to generate signed URL: " + response.getBody());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signed URL: " + e.getMessage(), e);
        }
    }

    private String uploadToSupabase(byte[] fileContent, String filename, String contentType, String bucket) throws IOException {
        String url = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, bucket, filename);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        if (contentType != null) {
            headers.set("Content-Type", contentType);
        } else {
            headers.set("Content-Type", "application/octet-stream");
        }

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(fileContent, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IOException("Failed to upload file to Supabase: " + response.getBody());
            }
        } catch (Exception e) {
            throw new IOException("Failed to upload file to Supabase: " + e.getMessage(), e);
        }

        if (bucket.equals("property-media")) {
            return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, bucket, filename);
        } else {
            // For private buckets, we just return the filename so it can be signed later
            return filename;
        }
    }
}
