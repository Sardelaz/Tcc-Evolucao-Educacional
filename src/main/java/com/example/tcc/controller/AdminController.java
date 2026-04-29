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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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

        int acertosTotalGeral = 0;
        int errosTotalGeral = 0;
        Map<String, Integer> errosAgregadosGeral = new HashMap<>();
        Map<String, Integer> perfeitasAgregadasGeral = new HashMap<>();

        Pattern patternAcertos = Pattern.compile("acertos[\"']?\\s*[:=]\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
        Pattern patternErros = Pattern.compile("erros[\"']?\\s*[:=]\\s*(\\d+)", Pattern.CASE_INSENSITIVE);

        for (Usuario u : usuarios) {
            if (u.getStatusDasFases() != null) {
                for (Map.Entry<String, String> entry : u.getStatusDasFases().entrySet()) {
                    String chave = entry.getKey();
                    String json = entry.getValue();

                    if (chavesValidas.contains(chave) && json != null) {
                        String nomeFase = formatarNomeFase(chave, nomesModulos);
                        int a = 0;
                        int e = 0;
                        boolean isJson = false;

                        Matcher ma = patternAcertos.matcher(json);
                        if (ma.find()) {
                            a = Integer.parseInt(ma.group(1));
                            isJson = true;
                        }

                        Matcher me = patternErros.matcher(json);
                        if (me.find()) {
                            e = Integer.parseInt(me.group(1));
                            isJson = true;
                        }

                        if (isJson) {
                            acertosTotalGeral += a;
                            errosTotalGeral += e;

                            if (e > 0) {
                                errosAgregadosGeral.put(nomeFase, errosAgregadosGeral.getOrDefault(nomeFase, 0) + e);
                            } else if (a > 0 && e == 0) {
                                perfeitasAgregadasGeral.put(nomeFase, perfeitasAgregadasGeral.getOrDefault(nomeFase, 0) + 1);
                            }
                        }
                    }
                }
            }
        }

        analise.put("acertos", acertosTotalGeral);
        analise.put("erros", errosTotalGeral);

        List<Map<String, Object>> fasesMaisPerfeitas = perfeitasAgregadasGeral.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("nomeFase", e.getKey());
                    map.put("quantidade", e.getValue());
                    return map;
                })
                .collect(Collectors.toList());

        List<String> questoesCriticasGeral = errosAgregadosGeral.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(e -> String.format("%s - %d erros", e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        analise.put("fasesMaisPerfeitas", fasesMaisPerfeitas);
        analise.put("questoesCriticasGeral", questoesCriticasGeral); 
        
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
        analise.put("streakDiaria", u.getStreakDiaria());
        analise.put("emblemas", u.getEmblemas());
        analise.put("statusFases", u.getStatusDasFases());

        int acertosTotalAluno = 0;
        int errosTotalAluno = 0;
        Map<String, Integer> errosAgregadosAluno = new HashMap<>();
        List<String> perfeitasAluno = new ArrayList<>();

        Pattern patternAcertos = Pattern.compile("acertos[\"']?\\s*[:=]\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
        Pattern patternErros = Pattern.compile("erros[\"']?\\s*[:=]\\s*(\\d+)", Pattern.CASE_INSENSITIVE);

        if (u.getStatusDasFases() != null) {
            for (Map.Entry<String, String> entry : u.getStatusDasFases().entrySet()) {
                String chave = entry.getKey();
                String json = entry.getValue();

                if (chavesValidas.contains(chave) && json != null) {
                    String nomeFase = formatarNomeFase(chave, nomesModulos);
                    int a = 0;
                    int e = 0;
                    boolean isJson = false;

                    Matcher ma = patternAcertos.matcher(json);
                    if (ma.find()) {
                        a = Integer.parseInt(ma.group(1));
                        isJson = true;
                    }

                    Matcher me = patternErros.matcher(json);
                    if (me.find()) {
                        e = Integer.parseInt(me.group(1));
                        isJson = true;
                    }

                    if (isJson) {
                        acertosTotalAluno += a;
                        errosTotalAluno += e;

                        if (e > 0) {
                            errosAgregadosAluno.put(nomeFase, errosAgregadosAluno.getOrDefault(nomeFase, 0) + e);
                        } else if (a > 0 && e == 0) {
                            perfeitasAluno.add(nomeFase);
                        }
                    }
                }
            }
        }

        analise.put("acertos", acertosTotalAluno);
        analise.put("erros", errosTotalAluno);

        List<String> questoesErradasRecentes = errosAgregadosAluno.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(e -> String.format("%s - %d erros", e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        analise.put("fasesPerfeitas", perfeitasAluno);
        analise.put("questoesErradasRecentes", questoesErradasRecentes);
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
        
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        Map<String, Object> detalhes = new HashMap<>();
        
        if (u.getStatusDasFases() == null || u.getStatusDasFases().isEmpty()) {
            detalhes.put("encontrado", false);
            return ResponseEntity.ok(detalhes);
        }

        String paramModulo = modulo.trim().toLowerCase();
        
        Optional<String> chaveFase = u.getStatusDasFases().keySet().stream()
                .filter(k -> {
                    if (k == null) return false;
                    try {
                        String kLower = k.toLowerCase().trim();
                        if (kLower.contains("_fase")) {
                            String[] partes = kLower.split("_fase");
                            String mod = partes[0].trim();
                            String num = partes[1].split("_id")[0].trim();
                            return mod.equals(paramModulo) && num.equals(String.valueOf(fase));
                        } else if (kLower.contains("-")) {
                            String[] partes = kLower.split("-");
                            String mod = partes[0].trim();
                            String num = partes[1].trim();
                            return mod.equals(paramModulo) && num.equals(String.valueOf(fase));
                        }
                    } catch (Exception e) { return false; }
                    return false;
                })
                .max((k1, k2) -> Integer.compare(extrairIdDaChave(k1), extrairIdDaChave(k2)));

        if (chaveFase.isPresent()) {
            String statusValue = u.getStatusDasFases().get(chaveFase.get());
            detalhes.put("encontrado", true);
            detalhes.put("dadosBrutos", statusValue); 
        } else {
            detalhes.put("encontrado", false);
        }

        return ResponseEntity.ok(detalhes);
    }
    
    private int extrairIdDaChave(String chave) {
        if (chave == null) return -1;
        try {
            String kLower = chave.toLowerCase();
            if (kLower.contains("_id")) {
                return Integer.parseInt(kLower.split("_id")[1].trim());
            }
        } catch (Exception e) { return -1; }
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
                
            return nomeExibicaoModulo + " - Fase " + numeroFase;
        } catch (Exception e) {
            return "FASE DESCONHECIDA";
        }
    }
}