package com.example.tcc.controller;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import com.example.tcc.service.AnalisePreditivaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/relatorios")
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final AnalisePreditivaService analisePreditivaService;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UsuarioRepository usuarioRepository, AnalisePreditivaService analisePreditivaService, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.analisePreditivaService = analisePreditivaService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/usuarios/lista")
    public ResponseEntity<List<Map<String, Object>>> listarAlunosResumo() {
        return ResponseEntity.ok(usuarioRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("nome", u.getNome());
            map.put("email", u.getEmail());
            map.put("nivel", u.getNivel());
            map.put("avatar", u.getAvatar() != null ? u.getAvatar() : "👨‍🎓");
            return map;
        }).collect(Collectors.toList()));
    }

    @GetMapping("/geral")
    public ResponseEntity<Map<String, Object>> buscarAnaliseGeral() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        Map<String, Object> analise = new HashMap<>();
        
        if (usuarios.isEmpty()) {
            analise.put("acertos", 0);
            analise.put("erros", 0);
            return ResponseEntity.ok(analise);
        }

        double mediaAcertos = usuarios.stream().mapToInt(Usuario::getTotalAcertos).average().orElse(0);
        double mediaErros = usuarios.stream().mapToInt(Usuario::getTotalErros).average().orElse(0);

        analise.put("acertos", (int) mediaAcertos);
        analise.put("erros", (int) mediaErros);

        Map<String, Long> rankingPerfeitas = usuarios.stream()
                .flatMap(u -> u.getFasesPerfeitas().stream())
                .collect(Collectors.groupingBy(f -> f, Collectors.counting()));

        Map<String, Long> fasesCriticas = usuarios.stream()
                .flatMap(u -> u.getStatusDasFases().keySet().stream()
                        .filter(fase -> !u.getFasesPerfeitas().contains(fase)))
                .collect(Collectors.groupingBy(f -> f, Collectors.counting()));

        analise.put("fasesMaisPerfeitas", formatarRanking(rankingPerfeitas));
        analise.put("fasesMaisCriticas", formatarRanking(fasesCriticas));
        
        return ResponseEntity.ok(analise);
    }

    @GetMapping("/usuarios/analise/{id}")
    public ResponseEntity<Map<String, Object>> buscarAnaliseAluno(@PathVariable String id) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        
        Map<String, Object> analise = new HashMap<>();
        analise.put("nome", u.getNome());
        analise.put("email", u.getEmail());
        analise.put("xp", u.getXp());
        analise.put("nivel", u.getNivel());
        analise.put("streak", u.getStreakDiaria());
        analise.put("emblemas", u.getEmblemas());
        analise.put("acertos", u.getTotalAcertos());
        analise.put("erros", u.getTotalErros());
        analise.put("statusFases", u.getStatusDasFases());
        analise.put("fasesPerfeitas", u.getFasesPerfeitas());
        
        analise.put("previsaoXp", analisePreditivaService.preverProximoDesempenho(u));
        analise.put("sugestao", analisePreditivaService.sugerirFocoEstudo(u));
        
        return ResponseEntity.ok(analise);
    }

    @PostMapping("/usuarios/alterar-senha/{id}")
    public ResponseEntity<Map<String, String>> alterarSenha(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        String novaSenha = payload.get("novaSenha");
        
        if (novaSenha == null || novaSenha.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("erro", "A senha deve ter no mínimo 4 caracteres."));
        }

        u.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(u);
        
        return ResponseEntity.ok(Map.of("mensagem", "Senha de " + u.getNome() + " alterada com sucesso!"));
    }

    private List<Map<String, Object>> formatarRanking(Map<String, Long> mapa) {
        return mapa.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("nomeFase", e.getKey());
                    item.put("quantidade", e.getValue());
                    return item;
                }).collect(Collectors.toList());
    }
}