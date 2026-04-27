package com.example.tcc.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@Service
public class UploadService {
    public Map<String, String> salvarImagem(MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            File dir = new File("uploads");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "imagem.png";
            String fileName = System.currentTimeMillis() + "_" + originalName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_");
            File serverFile = new File(dir.getAbsolutePath() + File.separator + fileName);
            file.transferTo(serverFile);

            response.put("url", "/uploads/" + fileName);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("erro", "Falha ao fazer upload da imagem");
        }
        return response;
    }
}