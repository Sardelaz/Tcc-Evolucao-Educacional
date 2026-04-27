package com.example.tcc.controller;

import com.example.tcc.domain.Modulo;
import com.example.tcc.repository.ModuloRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modulos")
public class ModuloController {

    private final ModuloRepository moduloRepository;

    public ModuloController(ModuloRepository moduloRepository) {
        this.moduloRepository = moduloRepository;
    }

    @GetMapping
    public List<Modulo> listar() {
        return moduloRepository.findAll();
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Modulo> buscarPorSlug(@PathVariable String slug) {
        return moduloRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Modulo> criar(@RequestBody Modulo modulo) {
        // Se a url amigável não for passada, garantimos a segurança da mesma
        if (modulo.getSlug() == null || modulo.getSlug().trim().isEmpty()) {
            String slugFormatado = modulo.getNome().toLowerCase()
                    .replaceAll("[\\u0300-\\u036f]", "") // Remove acentos
                    .replaceAll("[^a-z0-9]", "_"); // Substitui espaços por _
            modulo.setSlug(slugFormatado);
        }
        
        // Evita duplicados
        if (moduloRepository.findBySlug(modulo.getSlug()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(moduloRepository.save(modulo));
    }
}