package com.example.tcc.controller;

import com.example.tcc.service.UploadService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {
    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping
    public Map<String, String> uploadImagem(@RequestParam("file") MultipartFile file) {
        return uploadService.salvarImagem(file);
    }
}