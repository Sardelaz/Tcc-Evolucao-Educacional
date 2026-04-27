package com.example.tcc.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.io.File;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Define o caminho da pasta de uploads na raiz do projeto
        String uploadPath = Paths.get("uploads").toAbsolutePath().toString();
        
        // No Linux/Render, o caminho deve terminar com / para o Spring reconhecer como diretório
        if (!uploadPath.endsWith(File.separator)) {
            uploadPath += File.separator;
        }

        // Mapeia /uploads/** para a pasta física no servidor
        // O prefixo file: deve ser seguido pelo caminho absoluto
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath);
                
        // Garante que a pasta static/img também seja servida corretamente para o placeholder
        registry.addResourceHandler("/img/**")
                .addResourceLocations("classpath:/static/img/");
    }
}