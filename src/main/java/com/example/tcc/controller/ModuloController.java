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
        if (modulo.getSlug() == null || modulo.getSlug().trim().isEmpty()) {
            String slugFormatado = modulo.getNome().toLowerCase()
                    .replaceAll("[\\u0300-\\u036f]", "")
                    .replaceAll("[^a-z0-9]", "_");
            modulo.setSlug(slugFormatado);
        }
        
        if (moduloRepository.findBySlug(modulo.getSlug()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(moduloRepository.save(modulo));
    }

    // ENDPOINT PARA ATUALIZAR MÓDULO
    @PutMapping("/{id}")
    public ResponseEntity<Modulo> atualizar(@PathVariable Long id, @RequestBody Modulo moduloAtualizado) {
        return moduloRepository.findById(id).map(modulo -> {
            modulo.setNome(moduloAtualizado.getNome());
            modulo.setIcone(moduloAtualizado.getIcone());
            modulo.setCor(moduloAtualizado.getCor());
            // O slug geralmente não mudamos para não quebrar links existentes
            return ResponseEntity.ok(moduloRepository.save(modulo));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ENDPOINT PARA DELETAR MÓDULO
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (moduloRepository.existsById(id)) {
            moduloRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}