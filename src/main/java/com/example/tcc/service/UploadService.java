package com.example.tcc.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class UploadService {

    public Map<String, String> salvarImagem(MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            // Cria a pasta uploads na raiz se não existir
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Gera um nome único usando UUID para evitar erros de duplicidade e caracteres
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "imagem.png";
            String extensao = originalName.substring(originalName.lastIndexOf("."));
            String fileName = UUID.randomUUID().toString() + extensao;

            // Salva o arquivo no sistema
            Path filePath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            // Retorna a URL que o WebConfig vai interceptar
            response.put("url", "/uploads/" + fileName);
            
        } catch (IOException e) {
            e.printStackTrace();
            response.put("erro", "Falha ao fazer upload da imagem: " + e.getMessage());
        }
        return response;
    }
}