package com.example.tcc.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // CORREÇÃO CRÍTICA: toUri().toString() resolve automaticamente para "file:///" 
        // Isso garante total compatibilidade no Windows (ambiente de dev) e no Linux (Render)
        String uploadPath = Paths.get("uploads").toAbsolutePath().toUri().toString();

        // Mapeia /uploads/** para a pasta física absoluta no servidor
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
                
        // Garante que a pasta static/img também seja servida corretamente para o placeholder
        registry.addResourceHandler("/img/**")
                .addResourceLocations("classpath:/static/img/");
                
        // Impede que a ausência do favicon polua seu console com erros 404
        registry.addResourceHandler("/favicon.ico")
                .addResourceLocations("classpath:/static/");
    }
}