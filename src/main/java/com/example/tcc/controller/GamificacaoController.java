package com.example.tcc.controller;

import com.example.tcc.dto.ResultadoFaseDTO;
import com.example.tcc.service.GamificacaoService;
import com.example.tcc.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class GamificacaoController {

    private final UsuarioService usuarioService;
    private final GamificacaoService gamificacaoService;

    public GamificacaoController(UsuarioService usuarioService, GamificacaoService gamificacaoService) {
        this.usuarioService = usuarioService;
        this.gamificacaoService = gamificacaoService;
    }

    @GetMapping("/perfil")
    public ResponseEntity<Map<String, Object>> buscarPerfil() {
        return ResponseEntity.ok(usuarioService.carregarPerfil());
    }

    @GetMapping("/usuario/heatmap-data")
    public ResponseEntity<Map<Long, Integer>> getHeatmapData() {
        return ResponseEntity.ok(usuarioService.getHeatmapData());
    }

    @GetMapping("/ranking")
    public ResponseEntity<Map<String, Object>> obterRanking(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String avatar) {
        
        Map<String, List<Map<String, Object>>> rankings = usuarioService.carregarRanking(avatar);
        List<Map<String, Object>> listaCompleta = rankings.getOrDefault("nivel", new ArrayList<>());
        
        int totalUsuarios = listaCompleta.size();
        int totalPages = (int) Math.ceil((double) totalUsuarios / size);
        int start = Math.min(page * size, totalUsuarios);
        int end = Math.min(start + size, totalUsuarios);
        
        List<Map<String, Object>> usuariosPaginados = listaCompleta.subList(start, end);
        
        String ligaUsuario = listaCompleta.stream()
                .filter(u -> Boolean.TRUE.equals(u.get("isCurrentUser")))
                .map(u -> (String) u.get("liga"))
                .findFirst().orElse("FERRO");

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("usuarios", usuariosPaginados);
        resposta.put("currentPage", page);
        resposta.put("totalPages", totalPages == 0 ? 1 : totalPages);
        resposta.put("liga", ligaUsuario);

        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/progresso")
    public ResponseEntity<Map<String, String>> carregarProgresso() {
        return ResponseEntity.ok(usuarioService.carregarProgresso());
    }

    // Correção: Adição do @Valid para garantir que as regras do ResultadoFaseDTO sejam respeitadas
    @PostMapping("/progresso/{lessonId}")
    public ResponseEntity<Map<String, Object>> concluirFase(@PathVariable String lessonId, @Valid @RequestBody ResultadoFaseDTO dto) {
        return ResponseEntity.ok(gamificacaoService.concluirFase(lessonId, dto));
    }

    @PostMapping("/checkin")
    public ResponseEntity<Map<String, Object>> fazerCheckin() {
        return ResponseEntity.ok(gamificacaoService.fazerCheckin());
    }

    @PostMapping("/desafio-diario")
    public ResponseEntity<Map<String, Object>> completarDesafio(@RequestBody Map<String, Integer> payload) {
        return ResponseEntity.ok(gamificacaoService.completarDesafioDiario(payload));
    }

    @PostMapping("/usuario/avatar")
    public ResponseEntity<Void> atualizarAvatar(@RequestBody Map<String, String> payload) {
        usuarioService.atualizarAvatar(payload.get("avatar"));
        return ResponseEntity.ok().build();
    }
}