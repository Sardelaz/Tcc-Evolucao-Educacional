package com.example.tcc.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class UploadService {

    public Map<String, String> salvarImagem(MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            byte[] bytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(bytes);
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/png";
            String base64String = "data:" + mimeType + ";base64," + base64Image;

            response.put("url", base64String);
        } catch (IOException e) {
            e.printStackTrace();
            response.put("erro", "Falha ao processar a imagem: " + e.getMessage());
        }
        return response;
    }
}