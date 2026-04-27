package com.example.tcc.controller;

import com.example.tcc.domain.Usuario;
import com.example.tcc.domain.UsuarioMissao;
import com.example.tcc.repository.UsuarioMissaoRepository;
import com.example.tcc.service.GamificacaoService;
import com.example.tcc.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missoes")
public class MissaoController {

    private final UsuarioMissaoRepository usuarioMissaoRepository;
    private final UsuarioService usuarioService;
    private final GamificacaoService gamificacaoService;

    public MissaoController(UsuarioMissaoRepository usuarioMissaoRepository, UsuarioService usuarioService, GamificacaoService gamificacaoService) {
        this.usuarioMissaoRepository = usuarioMissaoRepository;
        this.usuarioService = usuarioService;
        this.gamificacaoService = gamificacaoService;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioMissao>> buscarMissoesDoUsuario() {
        Usuario currentUser = usuarioService.getCurrentUser();
        
        // Agora o método atribuirMissoesSeVazio é public no GamificacaoService
        gamificacaoService.atribuirMissoesSeVazio(currentUser);
        
        List<UsuarioMissao> missoes = usuarioMissaoRepository.findByUsuario(currentUser);
        return ResponseEntity.ok(missoes);
    }
}