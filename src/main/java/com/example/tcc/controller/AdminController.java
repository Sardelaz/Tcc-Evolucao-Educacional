package com.example.tcc.controller;

import com.example.tcc.domain.Fase;
import com.example.tcc.domain.Modulo;
import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.FaseRepository;
import com.example.tcc.repository.ModuloRepository;
import com.example.tcc.repository.UsuarioRepository;
import com.example.tcc.service.AnalisePreditivaService;
import com.example.tcc.service.RankingService;
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
    private final RankingService rankingService;

    public AdminController(UsuarioRepository usuarioRepository, 
                           AnalisePreditivaService analisePreditivaService, 
                           PasswordEncoder passwordEncoder,
                           FaseRepository faseRepository,
                           ModuloRepository moduloRepository,
                           RankingService rankingService) {
        this.usuarioRepository = usuarioRepository;
        this.analisePreditivaService = analisePreditivaService;
        this.passwordEncoder = passwordEncoder;
        this.faseRepository = faseRepository;
        this.moduloRepository = moduloRepository;
        this.rankingService = rankingService;
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

        Map<String, Long> rankingPerfeitas = usuarios.stream()
                .flatMap(u -> u.getFasesPerfeitas().stream())
                .filter(chavesValidas::contains)
                .collect(Collectors.groupingBy(chave -> formatarNomeFase(chave, nomesModulos), Collectors.counting()));

        List<String> todasQuestoesErradas = usuarios.stream()
                .flatMap(u -> u.getUltimasQuestoesErradas().stream())
                .limit(20) 
                .collect(Collectors.toList());

        analise.put("fasesMaisPerfeitas", formatarRanking(rankingPerfeitas));
        analise.put("questoesCriticasGeral", todasQuestoesErradas); 
        
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
        analise.put("streakDiaria", u.getStreakDiaria());
        analise.put("emblemas", u.getEmblemas());
        analise.put("statusFases", u.getStatusDasFases());
        analise.put("questoesErradasRecentes", u.getUltimasQuestoesErradas());

        List<String> perfeitasFormatadas = u.getFasesPerfeitas().stream()
                .filter(chavesValidas::contains)
                .map(chave -> formatarNomeFase(chave, nomesModulos))
                .collect(Collectors.toList());

        analise.put("fasesPerfeitas", perfeitasFormatadas);
        analise.put("previsaoXp", analisePreditivaService.preverProximoDesempenho(u));
        analise.put("sugestao", analisePreditivaService.sugerirFocoEstudo(u));

        String ligaAtual = u.getLiga() != null ? u.getLiga() : "FERRO";
        analise.put("liga", ligaAtual);

        List<Usuario> rankingLiga = usuarioRepository.findAll().stream()
                .filter(user -> !"ROLE_ADMIN".equals(user.getRole())) 
                .filter(user -> ligaAtual.equals(user.getLiga() != null ? user.getLiga() : "FERRO"))
                .sorted((a, b) -> Integer.compare(b.getXp(), a.getXp()))
                .collect(Collectors.toList());

        int posicao = rankingLiga.indexOf(u) + 1;
        analise.put("posicao", posicao);

        Map<String, Object> requisitos = rankingService.obterRequisitosLiga(ligaAtual);
        int promocaoTop = (int) requisitos.getOrDefault("promocaoTop", 0);
        int rebaixamentoPos = (int) requisitos.getOrDefault("rebaixamentoPos", 0);

        String statusRanking = "MANTIDO";
        if (promocaoTop > 0 && posicao <= promocaoTop) {
            statusRanking = "PROMOVIDO";
        } else if (rebaixamentoPos > 0 && posicao >= rebaixamentoPos) {
            statusRanking = "REBAIXADO";
        }
        analise.put("statusRanking", statusRanking);
        
        return ResponseEntity.ok(analise);
    }

    @GetMapping("/usuarios/detalhes-fase/{id}")
    public ResponseEntity<Map<String, Object>> buscarDetalhesFaseAluno(
            @PathVariable String id, 
            @RequestParam String modulo, 
            @RequestParam int fase) {
        
        System.out.println("========== INICIO BUSCA DETALHES DA FASE ==========");
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        System.out.println("LOG JAVA: Usuario -> " + u.getNome());
        System.out.println("LOG JAVA: Modulo Buscado -> [" + modulo + "] | Fase Buscada -> [" + fase + "]");
        
        Map<String, Object> detalhes = new HashMap<>();
        Map<String, String> statusFases = u.getStatusDasFases();
        
        if (statusFases == null || statusFases.isEmpty()) {
            System.out.println("LOG JAVA: O usuario nao possui NENHUMA fase registrada.");
            detalhes.put("encontrado", false);
            return ResponseEntity.ok(detalhes);
        }

        System.out.println("LOG JAVA: Chaves totais no banco para este usuario -> " + statusFases.keySet());

        String paramModulo = modulo.trim().toLowerCase();
        String paramFase = String.valueOf(fase).trim();
        List<String> chavesEncontradas = new ArrayList<>();

        for (String k : statusFases.keySet()) {
            if (k == null) continue;
            String kLower = k.toLowerCase().trim();
            boolean match = false;

            // Tenta varios formatos de match para garantir que não vai perder
            if (kLower.contains("_fase")) {
                String[] partes = kLower.split("_fase");
                String mod = partes[0].trim();
                String num = partes[1].split("_id")[0].trim();
                if ((mod.equals(paramModulo) || mod.contains(paramModulo) || paramModulo.contains(mod)) && num.equals(paramFase)) {
                    match = true;
                }
            } else if (kLower.contains("-")) {
                String[] partes = kLower.split("-");
                String mod = partes[0].trim();
                String num = partes[1].trim();
                if ((mod.equals(paramModulo) || mod.contains(paramModulo) || paramModulo.contains(mod)) && num.equals(paramFase)) {
                    match = true;
                }
            }
            
            // Fallback genérico se a chave tiver o nome do modulo e o numero da fase
            if (!match && kLower.contains(paramModulo) && (kLower.contains("fase" + paramFase) || kLower.endsWith("-" + paramFase))) {
                match = true;
            }

            if (match) {
                chavesEncontradas.add(k);
                System.out.println("LOG JAVA: -> Chave Correspondente Encontrada: " + k);
            }
        }

        // Ordena para tentar pegar sempre o maior ID (tentativa mais recente)
        chavesEncontradas.sort((k1, k2) -> Integer.compare(extrairIdDaChave(k2), extrairIdDaChave(k1)));

        String melhorChave = null;
        for (String key : chavesEncontradas) {
            String val = statusFases.get(key);
            if (val != null && val.toLowerCase().contains("acertos")) {
                melhorChave = key;
                break; // Achou a mais recente que contém os detalhes completos
            }
        }
        
        // Se não achou nenhuma com "acertos", pega a primeira que apareceu
        if (melhorChave == null && !chavesEncontradas.isEmpty()) {
            melhorChave = chavesEncontradas.get(0);
        }

        System.out.println("LOG JAVA: Melhor chave selecionada para envio -> " + melhorChave);

        if (melhorChave != null) {
            String statusValue = statusFases.get(melhorChave);
            System.out.println("LOG JAVA: Valor bruto que sera enviado ao JS -> " + statusValue);
            detalhes.put("encontrado", true);
            detalhes.put("dadosBrutos", statusValue); 
        } else {
            System.out.println("LOG JAVA: FALHA! Nenhuma chave atendeu aos requisitos.");
            detalhes.put("encontrado", false);
        }
        
        System.out.println("========== FIM BUSCA DETALHES DA FASE ==========");
        return ResponseEntity.ok(detalhes);
    }
    
    private int extrairIdDaChave(String chave) {
        if (chave == null) return -1;
        try {
            String kLower = chave.toLowerCase();
            if (kLower.contains("_id")) {
                return Integer.parseInt(kLower.split("_id")[1].trim());
            }
        } catch (Exception e) {
            return -1;
        }
        return -1;
    }
    
    @PostMapping("/usuarios/alterar-senha/{id}")
    public ResponseEntity<Map<String, String>> alterarSenha(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        String novaSenha = payload.get("novaSenha");
        u.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(u);
        Map<String, String> resp = new HashMap<>();
        resp.put("mensagem", "Senha alterada com sucesso!");
        return ResponseEntity.ok(resp);
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
        if (chave == null) return "FASE DESCONHECIDA";
        try {
            String kLower = chave.toLowerCase();
            String[] partesFase = kLower.split("_fase");
            String slugModulo = partesFase[0].trim();
            String numeroFase = partesFase[1].split("_id")[0].trim();
            
            String nomeExibicaoModulo = nomesModulos.entrySet().stream()
                .filter(e -> e.getKey().toLowerCase().equals(slugModulo))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(slugModulo.toUpperCase());
                
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