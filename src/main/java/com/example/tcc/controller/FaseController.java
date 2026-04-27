package com.example.tcc.controller;

import com.example.tcc.domain.Fase;
import com.example.tcc.service.FaseService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/fases")
public class FaseController {
    private final FaseService faseService;

    public FaseController(FaseService faseService) {
        this.faseService = faseService;
    }

    // Endpoint para buscar o próximo número de fase automático
    @GetMapping("/proxima/{modulo}")
    public ResponseEntity<Map<String, Integer>> buscarProximaFase(@PathVariable String modulo) {
        int proxima = faseService.buscarProximaFase(modulo);
        return ResponseEntity.ok(Map.of("proximaFase", proxima));
    }

    @PostMapping("/{modulo}")
    public ResponseEntity<Void> salvarFase(@PathVariable String modulo, @Valid @RequestBody Fase novaFase) {
        log.info("Requisição recebida para salvar fase no módulo: {}", modulo);
        faseService.salvarFase(modulo, novaFase);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{modulo}")
    public ResponseEntity<List<Fase>> carregarFases(@PathVariable String modulo) {
        return ResponseEntity.ok(faseService.carregarFases(modulo));
    }

    @GetMapping("/{modulo}/{faseId}")
    public ResponseEntity<Fase> carregarFaseEspecifica(@PathVariable String modulo, @PathVariable int faseId) {
        Fase fase = faseService.carregarFaseEspecifica(modulo, faseId);
        if (fase == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(fase);
    }

    @DeleteMapping("/{modulo}/{faseId}")
    public ResponseEntity<Void> deletarFase(@PathVariable String modulo, @PathVariable int faseId) {
        faseService.deletarFase(modulo, faseId);
        return ResponseEntity.ok().build();
    }
}