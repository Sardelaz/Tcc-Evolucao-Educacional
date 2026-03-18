package com.example.tcc;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.LocalDate;
import java.time.DayOfWeek;

@RestController
@RequestMapping("/api")
public class ApiController {

    private static Map<String, List<Fase>> bancoDeAulas = new HashMap<>();
    private static Map<String, String> statusDasFases = new HashMap<>();
    private static int streakDiaria = 0;
    
    private static int userXp = 0;
    private static int userLevel = 1;
    private static Set<String> fasesPerfeitas = new HashSet<>();
    private static String dataUltimoDesafioCompletado = "";

    // ==========================================
    // RASTREADORES DIÁRIOS (Para validar o desafio)
    // ==========================================
    private static String dataEstatisticas = "";
    private static int checkinsHoje = 0;
    private static int fasesConcluidasHoje = 0;
    private static int maiorComboHoje = 0;
    private static int fasesPerfeitasHoje = 0;

    // Zera os contadores caso o dia tenha virado
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

    // Inicializador com as 10 fases prontas de Razão (Mantido)
    static {
        adicionarFase("razao", 1, criarQuestao("multipla", "O que é uma razão na matemática?", Arrays.asList("Uma soma de valores", "Uma divisão entre dois números", "Uma multiplicação", "Uma equação"), "Uma divisão entre dois números"), criarQuestao("multipla", "Em uma sala há 10 meninos e 20 meninas. Qual a razão entre meninos e meninas?", Arrays.asList("1/3", "1/2", "2/1", "10/30"), "1/2"));
        adicionarFase("razao", 2, criarQuestao("multipla", "Simplifique a razão 15/20:", Arrays.asList("1/2", "5/4", "3/4", "15/2"), "3/4"), criarQuestao("multipla", "Qual a razão entre 50 centavos e 2 reais?", Arrays.asList("1/4", "1/2", "1/5", "1/10"), "1/4"));
        adicionarFase("razao", 3, criarQuestao("multipla", "O que é uma proporção?", Arrays.asList("Igualdade entre duas razões", "Diferença de dois números", "A raiz de uma razão", "Soma de frações"), "Igualdade entre duas razões"), criarQuestao("multipla", "Os números 2, 3, 4 e 6 formam uma proporção nessa ordem?", Arrays.asList("Sim", "Não", "Apenas se somados", "Faltam dados"), "Sim"));
        adicionarFase("razao", 4, criarQuestao("multipla", "Na proporção X/4 = 3/6, qual o valor de X?", Arrays.asList("1", "2", "3", "4"), "2"), criarQuestao("multipla", "Se 2 cadernos custam R$ 10, quanto custam 5 cadernos?", Arrays.asList("R$ 15", "R$ 20", "R$ 25", "R$ 30"), "R$ 25"));
        adicionarFase("razao", 5, criarQuestao("multipla", "O que indica uma escala de 1:100 em um mapa?", Arrays.asList("1 cm no mapa = 100 cm no real", "100 cm no mapa = 1 cm no real", "O mapa tem 100 cm", "É 100 vezes maior"), "1 cm no mapa = 100 cm no real"), criarQuestao("multipla", "Em uma escala 1:50, um objeto com 2 cm tem qual tamanho real?", Arrays.asList("25 cm", "50 cm", "100 cm", "200 cm"), "100 cm"));
        adicionarFase("razao", 6, criarQuestao("multipla", "Se a quantidade de ingredientes dobra, o rendimento:", Arrays.asList("Dobra também", "Cai pela metade", "Fica igual", "Triplica"), "Dobra também"), criarQuestao("multipla", "Se 1 kg de carne custa R$ 30, quanto custam 3 kg?", Arrays.asList("R$ 60", "R$ 90", "R$ 120", "R$ 30"), "R$ 90"));
        adicionarFase("razao", 7, criarQuestao("multipla", "Se 4 pessoas limpam em 6 horas, 8 pessoas limpariam em:", Arrays.asList("3 horas", "4 horas", "8 horas", "12 horas"), "3 horas"), criarQuestao("multipla", "Velocidade e Tempo de viagem são grandezas:", Arrays.asList("Diretamente proporcionais", "Inversamente proporcionais", "Não têm relação", "Iguais"), "Inversamente proporcionais"));
        adicionarFase("razao", 8, criarQuestao("multipla", "A razão das idades é 2/3. Se o mais novo tem 10, o mais velho tem:", Arrays.asList("12 anos", "15 anos", "20 anos", "30 anos"), "15 anos"), criarQuestao("multipla", "Divida R$ 100 proporcionalmente a 2 e 3:", Arrays.asList("R$ 20 e R$ 80", "R$ 30 e R$ 70", "R$ 40 e R$ 60", "R$ 50 e R$ 50"), "R$ 40 e R$ 60"));
        adicionarFase("razao", 9, criarQuestao("multipla", "No mapa (1:1.000.000) mede 5 cm. Qual a distância real?", Arrays.asList("5 km", "50 km", "500 km", "5000 km"), "50 km"), criarQuestao("multipla", "Miniatura 1:43 com 10 cm, o real mede:", Arrays.asList("4,3 cm", "43 cm", "430 cm", "4300 cm"), "430 cm"));
        adicionarFase("razao", 10, criarQuestao("multipla", "1 torneira enche em 4h. 2 torneiras enchem em:", Arrays.asList("1 hora", "2 horas", "4 horas", "8 horas"), "2 horas"), criarQuestao("multipla", "Se A/B = 3/4 e B/C = 4/5, qual a razão de A/C?", Arrays.asList("3/4", "3/5", "4/5", "12/20"), "3/5"));
    }

    private static Questao criarQuestao(String tipo, String enunciado, List<String> alternativas, String resposta) {
        Questao q = new Questao(); q.tipo = tipo; q.enunciado = enunciado; q.alternativas = alternativas; q.resposta = resposta; return q;
    }

    private static void adicionarFase(String modulo, int numeroFase, Questao... questoes) {
        bancoDeAulas.putIfAbsent(modulo, new ArrayList<>());
        Fase f = new Fase(); f.fase = numeroFase; f.questoes = Arrays.asList(questoes); f.qtd = f.questoes.size();
        bancoDeAulas.get(modulo).add(f);
    }

    @PostMapping("/fases/{modulo}")
    public void salvarFase(@PathVariable String modulo, @RequestBody Fase novaFase) {
        bancoDeAulas.putIfAbsent(modulo, new ArrayList<>());
        List<Fase> fases = bancoDeAulas.get(modulo);
        fases.removeIf(f -> f.fase == novaFase.fase);
        fases.add(novaFase);
        fases.sort(Comparator.comparingInt(f -> f.fase));
    }

    @GetMapping("/fases/{modulo}")
    public List<Fase> carregarFases(@PathVariable String modulo) {
        return bancoDeAulas.getOrDefault(modulo, new ArrayList<>());
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
        
        if (!fasesPerfeitas.contains(lessonId)) {
            xpGanho = (resultado.acertos * 10) + (resultado.maxStreak * 5);
            userXp += xpGanho;
            
            if (resultado.acertos == resultado.totalQuestoes && resultado.totalQuestoes > 0) {
                fasesPerfeitas.add(lessonId);
                fasesPerfeitasHoje++;
            }
        }
        
        userLevel = (userXp / 100) + 1;

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
        
        String hoje = LocalDate.now().toString();
        perfil.put("desafioConcluidoHoje", hoje.equals(dataUltimoDesafioCompletado));
        
        return perfil;
    }

    @PostMapping("/checkin")
    public Map<String, Integer> fazerCheckin() {
        verificarResetDiario();
        checkinsHoje++; 
        streakDiaria++; 
        userXp += 100;
        userLevel = (userXp / 100) + 1;

        Map<String, Integer> resposta = new HashMap<>();
        resposta.put("streak", streakDiaria);
        resposta.put("xp", userXp);
        resposta.put("nivel", userLevel);
        resposta.put("xpProximoNivel", userLevel * 100);
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

        // LÓGICA DE VALIDAÇÃO DO DESAFIO
        int diaSemana = LocalDate.now().getDayOfWeek().getValue(); // 1=Segunda, 7=Domingo
        boolean condicaoAtendida = false;

        switch (diaSemana) {
            case 7: // Domingo: Descanso Ativo (Check-in)
                condicaoAtendida = (checkinsHoje >= 1); break;
            case 1: // Segunda: Concluir 1 fase
                condicaoAtendida = (fasesConcluidasHoje >= 1); break;
            case 2: // Terça: Combo de 3
                condicaoAtendida = (maiorComboHoje >= 3); break;
            case 3: // Quarta: Combo de 5
                condicaoAtendida = (maiorComboHoje >= 5); break;
            case 4: // Quinta: 2 Fases
                condicaoAtendida = (fasesConcluidasHoje >= 2); break;
            case 5: // Sexta: Check-in e 1 Fase
                condicaoAtendida = (checkinsHoje >= 1 && fasesConcluidasHoje >= 1); break;
            case 6: // Sábado: 100% em uma fase
                condicaoAtendida = (fasesPerfeitasHoje >= 1); break;
        }

        if (!condicaoAtendida) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "Objetivo não concluído! Vá estudar, cumpra o desafio e tente novamente.");
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
        resposta.put("xpProximoNivel", userLevel * 100);
        return resposta;
    }
}