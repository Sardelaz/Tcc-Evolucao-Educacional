package com.example.tcc.controller;

import com.example.tcc.domain.Fase;
import com.example.tcc.domain.Modulo;
import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.FaseRepository;
import com.example.tcc.repository.ModuloRepository;
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
    private final FaseRepository faseRepository;
    private final ModuloRepository moduloRepository;

    public AdminController(UsuarioRepository usuarioRepository, 
                           AnalisePreditivaService analisePreditivaService, 
                           PasswordEncoder passwordEncoder,
                           FaseRepository faseRepository,
                           ModuloRepository moduloRepository) {
        this.usuarioRepository = usuarioRepository;
        this.analisePreditivaService = analisePreditivaService;
        this.passwordEncoder = passwordEncoder;
        this.faseRepository = faseRepository;
        this.moduloRepository = moduloRepository;
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

        Set<String> chavesValidas = obterChavesDeFasesAtivas();
        Map<String, String> nomesModulos = obterMapaNomesModulos();

        analise.put("acertos", (int) usuarios.stream().mapToInt(Usuario::getTotalAcertos).average().orElse(0));
        analise.put("erros", (int) usuarios.stream().mapToInt(Usuario::getTotalErros).average().orElse(0));

        // Ranking de Fases Perfeitas
        Map<String, Long> rankingPerfeitas = usuarios.stream()
                .flatMap(u -> u.getFasesPerfeitas().stream())
                .filter(chavesValidas::contains)
                .collect(Collectors.groupingBy(chave -> formatarNomeFase(chave, nomesModulos), Collectors.counting()));

        // Ranking de Fases Críticas (Aqui mostramos as questões reais erradas pelos alunos)
        List<String> todasQuestoesErradas = usuarios.stream()
                .flatMap(u -> u.getUltimasQuestoesErradas().stream())
                .limit(20) // Mostra as 20 questões mais críticas do sistema global
                .collect(Collectors.toList());

        analise.put("fasesMaisPerfeitas", formatarRanking(rankingPerfeitas));
        analise.put("questoesCriticasGeral", todasQuestoesErradas); // Alterado para mostrar questões
        
        return ResponseEntity.ok(analise);
    }

    @GetMapping("/usuarios/analise/{id}")
    public ResponseEntity<Map<String, Object>> buscarAnaliseAluno(@PathVariable String id) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        Set<String> chavesValidas = obterChavesDeFasesAtivas();
        Map<String, String> nomesModulos = obterMapaNomesModulos();

        Map<String, Object> analise = new HashMap<>();
        analise.put("nome", u.getNome());
        analise.put("email", u.getEmail());
        analise.put("xp", u.getXp());
        analise.put("nivel", u.getNivel());
        analise.put("acertos", u.getTotalAcertos());
        analise.put("erros", u.getTotalErros());
        
        // Relatório de Fases Críticas Individual: Lista as questões específicas que este aluno errou
        analise.put("questoesErradasRecentes", u.getUltimasQuestoesErradas());

        List<String> perfeitasFormatadas = u.getFasesPerfeitas().stream()
                .filter(chavesValidas::contains)
                .map(chave -> formatarNomeFase(chave, nomesModulos))
                .collect(Collectors.toList());

        analise.put("fasesPerfeitas", perfeitasFormatadas);
        analise.put("previsaoXp", analisePreditivaService.preverProximoDesempenho(u));
        analise.put("sugestao", analisePreditivaService.sugerirFocoEstudo(u));
        
        return ResponseEntity.ok(analise);
    }

    private Set<String> obterChavesDeFasesAtivas() {
        return faseRepository.findAll().stream()
                .map(f -> f.getModulo() + "_fase" + f.getFase() + "_id" + f.getId())
                .collect(Collectors.toSet());
    }

    private Map<String, String> obterMapaNomesModulos() {
        return moduloRepository.findAll().stream()
                .collect(Collectors.toMap(Modulo::getSlug, Modulo::getNome, (existente, novo) -> existente));
    }

    private String formatarNomeFase(String chave, Map<String, String> nomesModulos) {
        try {
            String[] partesFase = chave.split("_fase");
            String slugModulo = partesFase[0];
            String numeroFase = partesFase[1].split("_id")[0];
            String nomeExibicaoModulo = nomesModulos.getOrDefault(slugModulo, slugModulo.toUpperCase());
            return nomeExibicaoModulo + " - FASE " + numeroFase;
        } catch (Exception e) {
            return "FASE DESCONHECIDA";
        }
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