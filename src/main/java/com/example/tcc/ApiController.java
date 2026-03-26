package com.example.tcc;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api")
public class ApiController {

    // Aqui é onde as aulas e o progresso ficam guardados enquanto o servidor rodar
    private static Map<String, List<Fase>> bancoDeAulas = new HashMap<>();
    private static Map<String, String> statusDasFases = new HashMap<>();
    private static int streakDiaria = 0;
    
    private static int userXp = 0;
    private static int userLevel = 1;
    private static Set<String> fasesPerfeitas = new HashSet<>();
    private static String dataUltimoDesafioCompletado = "";

    // Variáveis para controlar o que o aluno fez hoje (zera todo dia)
    private static String dataEstatisticas = "";
    private static int checkinsHoje = 0;
    private static int fasesConcluidasHoje = 0;
    private static int maiorComboHoje = 0;
    private static int fasesPerfeitasHoje = 0;

    // Essa função limpa as metas diárias se o dia mudar
    private static void verificarResetDiario() {
        String hoje = LocalDate.now().toString();
        if (!hoje.equals(dataEstatisticas)) {
            dataEstatisticas = hoje;
            checkinsHoje = 0;
            fasesConcluidasHoje = 0;
            maiorComboHoje = 0;
            fasesPerfeitasHoje = 0;
        }
    }

    public static class Fase {
        public int fase;
        public int qtd;
        public List<Questao> questoes;
    }

    public static class Questao {
        public String tipo;
        public String enunciado;
        public List<String> alternativas;
        public String resposta;
    }

    public static class ResultadoFase {
        public int acertos;
        public int maxStreak;
        public int totalQuestoes; 
    }

    @PostMapping("/fases/{modulo}")
    public void salvarFase(@PathVariable String modulo, @RequestBody Fase novaFase) {
        bancoDeAulas.putIfAbsent(modulo, new ArrayList<>());
        List<Fase> fases = bancoDeAulas.get(modulo);
        fases.removeIf(f -> f.fase == novaFase.fase); // Se a fase já existir, a gente apaga a velha e põe a nova
        fases.add(novaFase);
        fases.sort(Comparator.comparingInt(f -> f.fase)); // Deixa as fases em ordem (1, 2, 3...)
    }

    @GetMapping("/fases/{modulo}")
    public List<Fase> carregarFases(@PathVariable String modulo) {
        return bancoDeAulas.getOrDefault(modulo, new ArrayList<>());
    }

    // NOVO: Endpoint para buscar uma fase específica para a tela de edição
    @GetMapping("/fases/{modulo}/{faseId}")
    public Fase carregarFaseEspecifica(@PathVariable String modulo, @PathVariable int faseId) {
        List<Fase> fases = bancoDeAulas.getOrDefault(modulo, new ArrayList<>());
        return fases.stream().filter(f -> f.fase == faseId).findFirst().orElse(null);
    }

    @PostMapping("/progresso/{lessonId}")
    public Map<String, Integer> concluirFase(@PathVariable String lessonId, @RequestBody ResultadoFase resultado) {
        verificarResetDiario();
        statusDasFases.put(lessonId, "completed");
        
        fasesConcluidasHoje++;
        if (resultado.maxStreak > maiorComboHoje) {
            maiorComboHoje = resultado.maxStreak;
        }

        int xpGanho = 0;
        // Só ganha XP se for a primeira vez que gabarita essa fase
        if (!fasesPerfeitas.contains(lessonId)) {
            xpGanho = (resultado.acertos * 10) + (resultado.maxStreak * 5);
            userXp += xpGanho;
            
            if (resultado.acertos == resultado.totalQuestoes && resultado.totalQuestoes > 0) {
                fasesPerfeitas.add(lessonId);
                fasesPerfeitasHoje++;
            }
        }
        
        userLevel = (userXp / 100) + 1; // A cada 100 de XP o nível sobe!

        Map<String, Integer> resposta = new HashMap<>();
        resposta.put("xpGanho", xpGanho);
        resposta.put("xpTotal", userXp);
        resposta.put("nivel", userLevel);
        return resposta;
    }

    @GetMapping("/progresso")
    public Map<String, String> carregarProgresso() {
        return statusDasFases;
    }

    @GetMapping("/perfil")
    public Map<String, Object> carregarPerfil() {
        verificarResetDiario();
        Map<String, Object> perfil = new HashMap<>();
        perfil.put("xp", userXp);
        perfil.put("nivel", userLevel);
        perfil.put("xpProximoNivel", userLevel * 100);
        perfil.put("streak", streakDiaria);
        perfil.put("fasesPerfeitas", new ArrayList<>(fasesPerfeitas)); 
        perfil.put("desafioConcluidoHoje", LocalDate.now().toString().equals(dataUltimoDesafioCompletado));
        return perfil;
    }

    @PostMapping("/checkin")
    public Map<String, Integer> fazerCheckin() {
        verificarResetDiario();
        checkinsHoje++; 
        streakDiaria++; 
        userXp += 100; // Check-in dá muito XP pra incentivar a entrar todo dia
        userLevel = (userXp / 100) + 1;

        Map<String, Integer> resposta = new HashMap<>();
        resposta.put("streak", streakDiaria);
        resposta.put("xp", userXp);
        resposta.put("nivel", userLevel);
        return resposta;
    }

    @PostMapping("/desafio-diario")
    public Map<String, Object> completarDesafioDiario(@RequestBody Map<String, Integer> payload) {
        verificarResetDiario();
        Map<String, Object> resposta = new HashMap<>();
        String hoje = LocalDate.now().toString();
        
        if (hoje.equals(dataUltimoDesafioCompletado)) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "Você já resgatou o desafio de hoje!");
            return resposta;
        }

        int diaSemana = LocalDate.now().getDayOfWeek().getValue(); // Pega o dia (1=Seg, 7=Dom)
        boolean condicaoAtendida = false;

        // Lógica dos desafios: cada dia pede uma coisa diferente
        switch (diaSemana) {
            case 7: condicaoAtendida = (checkinsHoje >= 1); break;
            case 1: condicaoAtendida = (fasesConcluidasHoje >= 1); break;
            case 2: condicaoAtendida = (maiorComboHoje >= 3); break;
            case 3: condicaoAtendida = (maiorComboHoje >= 5); break;
            case 4: condicaoAtendida = (fasesConcluidasHoje >= 2); break;
            case 5: condicaoAtendida = (checkinsHoje >= 1 && fasesConcluidasHoje >= 1); break;
            case 6: condicaoAtendida = (fasesPerfeitasHoje >= 1); break;
        }

        if (!condicaoAtendida) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "Objetivo não concluído! Vá estudar mais um pouco.");
            return resposta;
        }
        
        int xpGanho = payload.getOrDefault("xp", 50); 
        userXp += xpGanho;
        userLevel = (userXp / 100) + 1;
        dataUltimoDesafioCompletado = hoje; 
        
        resposta.put("sucesso", true);
        resposta.put("xpGanho", xpGanho);
        resposta.put("xpTotal", userXp);
        resposta.put("nivel", userLevel);
        return resposta;
    }
}