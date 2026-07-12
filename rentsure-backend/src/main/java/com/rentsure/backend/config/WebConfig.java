package com.rentsure.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configures static resource serving for local media uploads in DEV.
 */
@Configuration
@Profile("dev")
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.storage.local-dir:./media}")
    private String baseDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(baseDir);
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        
        registry.addResourceHandler("/media/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
