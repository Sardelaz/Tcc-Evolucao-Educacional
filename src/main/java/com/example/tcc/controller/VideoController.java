package com.example.tcc.controller;

import com.example.tcc.domain.Fase;
import com.example.tcc.domain.VideoAula;
import com.example.tcc.repository.FaseRepository;
import com.example.tcc.repository.VideoAulaRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoAulaRepository videoRepo;
    private final FaseRepository faseRepo;

    public VideoController(VideoAulaRepository videoRepo, FaseRepository faseRepo) {
        this.videoRepo = videoRepo;
        this.faseRepo = faseRepo;
    }

    @PostMapping
    public void salvarVideo(@RequestBody VideoAula video) {
        videoRepo.save(video);
    }

    @GetMapping
    public List<Map<String, String>> listarTodosOsVideos() {
        List<Map<String, String>> todosVideos = new ArrayList<>();

        // Vai buscar os vídeos atrelados às Fases
        List<Fase> fasesComVideo = faseRepo.findAll().stream()
                .filter(f -> f.getVideoAulaUrl() != null && !f.getVideoAulaUrl().trim().isEmpty())
                .toList();

        for (Fase f : fasesComVideo) {
            Map<String, String> v = new HashMap<>();
            v.put("titulo", "Videoaula: " + f.getModulo().toUpperCase() + " - Fase " + f.getFase());
            v.put("modulo", f.getModulo());
            v.put("url", f.getVideoAulaUrl());
            v.put("origem", "fase");
            todosVideos.add(v);
        }

        // Vai buscar os vídeos avulsos
        for (VideoAula va : videoRepo.findAll()) {
            Map<String, String> v = new HashMap<>();
            v.put("titulo", va.getTitulo());
            v.put("modulo", va.getModulo());
            v.put("url", va.getUrl());
            v.put("origem", "avulso");
            todosVideos.add(v);
        }

        return todosVideos;
    }

@GetMapping("/{id}")
    public ResponseEntity<VideoAula> buscarPorId(@PathVariable Long id) {
        return videoRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<VideoAula> atualizar(@PathVariable Long id, @RequestBody VideoAula video) {
        return videoRepo.findById(id).map(existente -> {
            existente.setTitulo(video.getTitulo());
            existente.setModulo(video.getModulo());
            existente.setUrl(video.getUrl());
            return ResponseEntity.ok(videoRepo.save(existente));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (videoRepo.existsById(id)) {
            videoRepo.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}