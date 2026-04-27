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
            // Define o caminho absoluto para a pasta de uploads no projeto
            String uploadDir = "src/main/resources/static/uploads/";
            File dir = new File(uploadDir);
            
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Gera um nome único para evitar conflitos de arquivos com o mesmo nome
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "imagem.png";
            String fileName = UUID.randomUUID().toString() + "_" + originalName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_");
            
            Path filePath = Paths.get(uploadDir + fileName);
            Files.copy(file.getInputStream(), filePath);

            // Retorna a URL relativa que será salva no banco de dados
            response.put("url", "/uploads/" + fileName);
            return response;

        } catch (IOException e) {
            e.printStackTrace();
            response.put("erro", "Falha ao fazer upload da imagem: " + e.getMessage());
            return response;
        }
    }
}