package com.example.tcc.controller;

import com.example.tcc.dto.ResultadoFaseDTO;
import com.example.tcc.service.GamificacaoService;
import com.example.tcc.service.UsuarioService;
import com.example.tcc.service.RankingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class GamificacaoController {

    private final UsuarioService usuarioService;
    private final GamificacaoService gamificacaoService;
    private final RankingService rankingService;

    public GamificacaoController(UsuarioService usuarioService, GamificacaoService gamificacaoService, RankingService rankingService) {
        this.usuarioService = usuarioService;
        this.gamificacaoService = gamificacaoService;
        this.rankingService = rankingService;
    }

    @GetMapping("/perfil")
    public ResponseEntity<Map<String, Object>> buscarPerfil() {
        return ResponseEntity.ok(usuarioService.carregarPerfil());
    }

    @GetMapping("/ranking")
    public ResponseEntity<Map<String, Object>> obterRanking(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String avatar) {
        
        return ResponseEntity.ok(rankingService.carregarRankingPaginado(page, size, avatar));
    }

    @PostMapping("/progresso/{lessonId}")
    public ResponseEntity<Map<String, Object>> concluirFase(@PathVariable String lessonId, @Valid @RequestBody ResultadoFaseDTO dto) {
        return ResponseEntity.ok(gamificacaoService.concluirFase(lessonId, dto));
    }

    @PostMapping("/checkin")
    public ResponseEntity<Map<String, Object>> fazerCheckin() {
        return ResponseEntity.ok(gamificacaoService.fazerCheckin());
    }

    @PostMapping("/usuario/avatar")
    public ResponseEntity<Void> atualizarAvatar(@RequestBody Map<String, String> payload) {
        usuarioService.atualizarAvatar(payload.get("avatar"));
        return ResponseEntity.ok().build();
    }
}