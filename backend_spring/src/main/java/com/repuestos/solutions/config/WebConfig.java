package com.repuestos.solutions.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sirve los archivos subidos (fotos, evidencias, imágenes de producto) desde ./uploads.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public WebConfig(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String base = uploadDir.endsWith("/") || uploadDir.endsWith("\\") ? uploadDir : uploadDir + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + base);
    }
}