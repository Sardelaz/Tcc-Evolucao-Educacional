package com.example.tcc.service;

import com.example.tcc.domain.Conquista;
import com.example.tcc.domain.Fase;
import com.example.tcc.domain.Questao;
import com.example.tcc.domain.Usuario;
import com.example.tcc.dto.ResultadoFaseDTO;
import com.example.tcc.repository.ConquistaRepository;
import com.example.tcc.repository.FaseRepository;
import com.example.tcc.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional 
public class GamificacaoService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final FaseRepository faseRepository;
    private final ConquistaRepository conquistaRepository;

    public GamificacaoService(UsuarioRepository usuarioRepository, UsuarioService usuarioService,
            FaseRepository faseRepository, ConquistaRepository conquistaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.faseRepository = faseRepository;
        this.conquistaRepository = conquistaRepository;
    }

    public Map<String, Object> concluirFase(String lessonId, ResultadoFaseDTO resultado) {
        // CORREÇÃO: Busca Fresca para garantir que o Map logAtividade seja alterável
        Usuario userSessao = usuarioService.getCurrentUser();
        Usuario user = usuarioRepository.findById(userSessao.getId()).orElse(userSessao);
        
        usuarioService.verificarResetDiario(user);

        Fase faseOriginal = faseRepository.findByModuloAndFase(resultado.getModulo(), resultado.getFase()).orElse(null);

        int xpDesafioValidado = 0;
        if (faseOriginal != null) {
            long totalDesafiosNoBanco = faseOriginal.getQuestoes().stream().filter(Questao::isDesafio).count();
            if (resultado.getDesafiosVencidosNestaFase() <= totalDesafiosNoBanco) {
                int valorXpExtra = faseOriginal.getQuestoes().stream()
                        .filter(Questao::isDesafio)
                        .map(q -> q.getXpExtra() != null ? q.getXpExtra() : 0)
                        .findFirst().orElse(0);
                xpDesafioValidado = resultado.getDesafiosVencidosNestaFase() * valorXpExtra;
            }
        }

        boolean jaEstavaConcluida = "completed".equals(user.getStatusDasFases().get(lessonId));
        user.getStatusDasFases().put(lessonId, "completed");

        int xpGanho = 0;
        int moedasGanhas = 0;

        user.setTotalQuestoesRespondidas(user.getTotalQuestoesRespondidas() + resultado.getTotalQuestoes());
        if (resultado.getModulo() != null && resultado.getModulo().contains("simulado")) {
            user.setTotalSimuladosConcluidos(user.getTotalSimuladosConcluidos() + 1);
        }

        // SALVAMENTO NO HEATMAP CORRIGIDO
        LocalDate hoje = LocalDate.now();
        user.getLogAtividade().put(hoje, user.getLogAtividade().getOrDefault(hoje, 0) + resultado.getTotalQuestoes());

        if (!jaEstavaConcluida) {
            user.setTotalAcertos(user.getTotalAcertos() + resultado.getAcertos());
            user.setTotalErros(user.getTotalErros() + resultado.getErros());
            user.setDesafiosVencidos(user.getDesafiosVencidos() + resultado.getDesafiosVencidosNestaFase());

            xpGanho = (resultado.getAcertos() * 10) + (resultado.getMaxStreak() * 5) + xpDesafioValidado;
            moedasGanhas = xpGanho / 5; 

            user.setXp(user.getXp() + xpGanho);
            user.setMoedas(user.getMoedas() + moedasGanhas);

            if (resultado.getAcertos() == resultado.getTotalQuestoes() && resultado.getTotalQuestoes() > 0) {
                user.getFasesPerfeitas().add(lessonId);
                user.setFasesPerfeitasHoje(user.getFasesPerfeitasHoje() + 1);
            }
        } else {
            if (resultado.getAcertos() == resultado.getTotalQuestoes() && resultado.getTotalQuestoes() > 0 && !user.getFasesPerfeitas().contains(lessonId)) {
                user.getFasesPerfeitas().add(lessonId);
                user.setFasesPerfeitasHoje(user.getFasesPerfeitasHoje() + 1);
            }
        }

        user.setNivel((user.getXp() / 100) + 1);
        atualizarLiga(user); 

        Set<String> emblemasAntigos = new HashSet<>(user.getEmblemas());
        verificarConquistas(user, resultado);

        List<String> badgesNovos = new ArrayList<>();
        for (String badge : user.getEmblemas()) {
            if (!emblemasAntigos.contains(badge)) badgesNovos.add(badge);
        }

        if ("ROLE_ADMIN".equals(user.getRole())) {
            user.setMoedas(9999999);
        }

        usuarioRepository.save(user);

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("xpGanho", xpGanho);
        resposta.put("moedasGanhas", moedasGanhas);
        resposta.put("nivel", user.getNivel());
        resposta.put("liga", user.getLiga());
        resposta.put("badgesNovos", badgesNovos);
        return resposta;
    }

    private void atualizarLiga(Usuario user) {
        int xp = user.getXp();
        if (xp >= 10000) user.setLiga("LENDA");
        else if (xp >= 5000) user.setLiga("DIAMANTE");
        else if (xp >= 2500) user.setLiga("OURO");
        else if (xp >= 1000) user.setLiga("PRATA");
        else if (xp >= 300) user.setLiga("BRONZE");
        else user.setLiga("FERRO");
    }

    private void verificarConquistas(Usuario user, ResultadoFaseDTO resultado) {
        if (user.getXp() >= 500) user.getEmblemas().add("badge_iniciante");
        if (user.getStreakDiaria() >= 7) user.getEmblemas().add("badge_ofensiva_7");
        if (resultado.getModulo() != null && resultado.getModulo().contains("simulado")) user.getEmblemas().add("badge_primeiro_simulado");

        if (user.getTotalQuestoesRespondidas() >= 100) user.getEmblemas().add("badge_cem_questoes");
        if (user.getTotalQuestoesRespondidas() >= 500) user.getEmblemas().add("badge_quinhentas_questoes");
        if (user.getTotalSimuladosConcluidos() >= 5) user.getEmblemas().add("badge_maratonista_simulados");

        List<Conquista> todasConquistas = conquistaRepository.findAll();
        for (Conquista c : todasConquistas) {
            String badgeId = "dynamic_" + c.getId();
            if (user.getEmblemas().contains(badgeId)) continue;

            boolean conquistou = switch (c.getTipoRequisito()) {
                case "XP" -> user.getXp() >= c.getValorObjetivo();
                case "NIVEL" -> user.getNivel() >= c.getValorObjetivo();
                case "OFENSIVA" -> user.getStreakDiaria() >= c.getValorObjetivo();
                case "PERFEITAS" -> user.getFasesPerfeitas().size() >= c.getValorObjetivo();
                case "DESAFIOS" -> user.getDesafiosVencidos() >= c.getValorObjetivo();
                default -> false;
            };
            if (conquistou) user.getEmblemas().add(badgeId);
        }
    }

    public Map<String, Object> fazerCheckin() {
        // CORREÇÃO: Busca Fresca da BD
        Usuario userSessao = usuarioService.getCurrentUser();
        Usuario user = usuarioRepository.findById(userSessao.getId()).orElse(userSessao);
        
        usuarioService.verificarResetDiario(user);

        Map<String, Object> resposta = new HashMap<>();

        // CORREÇÃO: Verifica se o utilizador já fez o check-in hoje
        if (user.getCheckinsHoje() > 0) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "Check-in já realizado hoje!");
            resposta.put("streak", user.getStreakDiaria());
            resposta.put("xp", user.getXp());
            resposta.put("moedas", user.getMoedas());
            resposta.put("nivel", user.getNivel());
            return resposta;
        }

        // Se não tiver feito, aplica as recompensas
        user.setCheckinsHoje(user.getCheckinsHoje() + 1);
        user.setStreakDiaria(user.getStreakDiaria() + 1);
        user.setXp(user.getXp() + 100);
        user.setMoedas(user.getMoedas() + 20); 
        user.setNivel((user.getXp() / 100) + 1);
        atualizarLiga(user);

        // SALVAMENTO NO HEATMAP CORRIGIDO
        LocalDate hoje = LocalDate.now();
        user.getLogAtividade().put(hoje, user.getLogAtividade().getOrDefault(hoje, 0) + 1);

        if ("ROLE_ADMIN".equals(user.getRole())) {
            user.setMoedas(9999999);
        }

        usuarioRepository.save(user);
        
        resposta.put("sucesso", true);
        resposta.put("streak", user.getStreakDiaria());
        resposta.put("xp", user.getXp());
        resposta.put("moedas", user.getMoedas());
        resposta.put("nivel", user.getNivel());
        return resposta;
    }

    public Map<String, Object> completarDesafioDiario(Map<String, Integer> payload) {
        // CORREÇÃO: Busca Fresca da BD
        Usuario userSessao = usuarioService.getCurrentUser();
        Usuario user = usuarioRepository.findById(userSessao.getId()).orElse(userSessao);
        
        usuarioService.verificarResetDiario(user);
        Map<String, Object> resposta = new HashMap<>();
        LocalDate hoje = LocalDate.now();
        
        if (hoje.equals(user.getDataUltimoDesafioCompletado())) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "Você já resgatou o desafio de hoje!");
            return resposta;
        }
        
        int diaSemana = hoje.getDayOfWeek().getValue();
        boolean condicaoAtendida = switch (diaSemana) {
            case 7 -> user.getCheckinsHoje() >= 1;
            case 1 -> user.getFasesConcluidasHoje() >= 1;
            case 2 -> user.getMaiorComboHoje() >= 3;
            case 3 -> user.getMaiorComboHoje() >= 5;
            case 4 -> user.getFasesConcluidasHoje() >= 2;
            case 5 -> user.getCheckinsHoje() >= 1 && user.getFasesConcluidasHoje() >= 1;
            case 6 -> user.getFasesPerfeitasHoje() >= 1;
            default -> false;
        };
        
        if (!condicaoAtendida) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "Objetivo não concluído!");
            return resposta;
        }
        
        int xpGanho = payload.getOrDefault("xp", 50);
        user.setXp(user.getXp() + xpGanho);
        user.setMoedas(user.getMoedas() + 50); 
        user.setNivel((user.getXp() / 100) + 1);
        user.setDataUltimoDesafioCompletado(hoje);
        user.getEmblemas().add("badge_desafio_diario");
        atualizarLiga(user);
        
        // SALVAMENTO NO HEATMAP CORRIGIDO
        user.getLogAtividade().put(hoje, user.getLogAtividade().getOrDefault(hoje, 0) + 1);
        
        if ("ROLE_ADMIN".equals(user.getRole())) {
            user.setMoedas(9999999);
        }

        usuarioRepository.save(user);
        
        resposta.put("sucesso", true);
        resposta.put("xpGanho", xpGanho);
        resposta.put("xpTotal", user.getXp());
        resposta.put("nivel", user.getNivel());
        return resposta;
    }
}