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
        // Busca o utilizador atual diretamente da BD para evitar cache
        Usuario userSessao = usuarioService.getCurrentUser();
        Usuario user = usuarioRepository.findById(userSessao.getId()).orElse(userSessao);
        
        usuarioService.verificarResetDiario(user);

        // Busca a fase real para obter o ID único do Banco de Dados
        Fase faseOriginal = faseRepository.findByModuloAndFase(resultado.getModulo(), resultado.getFase()).orElse(null);

        if (faseOriginal == null) {
            throw new RuntimeException("Fase não encontrada no banco de dados.");
        }

        // CORREÇÃO DEFINITIVA: Geramos uma chave que é impossível de duplicar entre módulos ou fases recriadas
        // Exemplo: "estatistica_fase1_id105"
        String chaveUnica = resultado.getModulo() + "_fase" + resultado.getFase() + "_id" + faseOriginal.getId();
        
        boolean jaEstavaConcluida = "completed".equals(user.getStatusDasFases().get(chaveUnica));

        int xpDesafioValidado = 0;
        long totalDesafiosNoBanco = faseOriginal.getQuestoes().stream().filter(Questao::isDesafio).count();
        if (resultado.getDesafiosVencidosNestaFase() <= totalDesafiosNoBanco) {
            int valorXpExtra = faseOriginal.getQuestoes().stream()
                    .filter(Questao::isDesafio)
                    .map(q -> q.getXpExtra() != null ? q.getXpExtra() : 0)
                    .findFirst().orElse(0);
            xpDesafioValidado = resultado.getDesafiosVencidosNestaFase() * valorXpExtra;
        }

        // Regista a conclusão com a chave robusta
        user.getStatusDasFases().put(chaveUnica, "completed");

        int xpGanho = 0;
        int moedasGanhas = 0;

        user.setTotalQuestoesRespondidas(user.getTotalQuestoesRespondidas() + resultado.getTotalQuestoes());
        if (resultado.getModulo() != null && resultado.getModulo().contains("simulado")) {
            user.setTotalSimuladosConcluidos(user.getTotalSimuladosConcluidos() + 1);
        }

        // Atualização do Heatmap
        LocalDate hoje = LocalDate.now();
        user.getLogAtividade().put(hoje, user.getLogAtividade().getOrDefault(hoje, 0) + resultado.getTotalQuestoes());

        // Atribui recompensas apenas se for a primeira vez que completa ESTA fase específica (pelo ID)
        if (!jaEstavaConcluida) {
            user.setTotalAcertos(user.getTotalAcertos() + resultado.getAcertos());
            user.setTotalErros(user.getTotalErros() + resultado.getErros());
            user.setDesafiosVencidos(user.getDesafiosVencidos() + resultado.getDesafiosVencidosNestaFase());

            xpGanho = (resultado.getAcertos() * 10) + (resultado.getMaxStreak() * 5) + xpDesafioValidado;
            moedasGanhas = xpGanho / 5; 

            user.setXp(user.getXp() + xpGanho);
            user.setMoedas(user.getMoedas() + moedasGanhas);

            if (resultado.getAcertos() == resultado.getTotalQuestoes() && resultado.getTotalQuestoes() > 0) {
                user.getFasesPerfeitas().add(chaveUnica);
                user.setFasesPerfeitasHoje(user.getFasesPerfeitasHoje() + 1);
            }
        } else {
            // Se já concluiu antes, apenas verifica se agora obteve um desempenho perfeito
            if (resultado.getAcertos() == resultado.getTotalQuestoes() && resultado.getTotalQuestoes() > 0 && !user.getFasesPerfeitas().contains(chaveUnica)) {
                user.getFasesPerfeitas().add(chaveUnica);
                user.setFasesPerfeitasHoje(user.getFasesPerfeitasHoje() + 1);
            }
        }

        user.setNivel((user.getXp() / 100) + 1);
        atualizarLiga(user); 
        verificarConquistas(user, resultado);

        if ("ROLE_ADMIN".equals(user.getRole())) {
            user.setMoedas(9999999);
        }

        usuarioRepository.save(user);

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("xpGanho", xpGanho);
        resposta.put("moedasGanhas", moedasGanhas);
        resposta.put("nivel", user.getNivel());
        resposta.put("liga", user.getLiga());
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
        
        List<Conquista> todasConquistas = conquistaRepository.findAll();
        for (Conquista c : todasConquistas) {
            String badgeId = "dynamic_" + c.getId();
            if (user.getEmblemas().contains(badgeId)) continue;

            boolean conquistou = switch (c.getTipoRequisito()) {
                case "XP" -> user.getXp() >= c.getValorObjetivo();
                case "NIVEL" -> user.getNivel() >= c.getValorObjetivo();
                case "PERFEITAS" -> user.getFasesPerfeitas().size() >= c.getValorObjetivo();
                default -> false;
            };
            if (conquistou) user.getEmblemas().add(badgeId);
        }
    }

    public Map<String, Object> fazerCheckin() {
        Usuario userSessao = usuarioService.getCurrentUser();
        Usuario user = usuarioRepository.findById(userSessao.getId()).orElse(userSessao);
        usuarioService.verificarResetDiario(user);

        if (user.getCheckinsHoje() > 0) return Collections.singletonMap("sucesso", false);

        user.setCheckinsHoje(1);
        user.setStreakDiaria(user.getStreakDiaria() + 1);
        user.setXp(user.getXp() + 100);
        user.setMoedas(user.getMoedas() + 20); 
        user.setNivel((user.getXp() / 100) + 1);
        atualizarLiga(user);
        usuarioRepository.save(user);
        
        return Collections.singletonMap("sucesso", true);
    }

    public Map<String, Object> completarDesafioDiario(Map<String, Integer> payload) {
        Usuario userSessao = usuarioService.getCurrentUser();
        Usuario user = usuarioRepository.findById(userSessao.getId()).orElse(userSessao);
        usuarioService.verificarResetDiario(user);

        LocalDate hoje = LocalDate.now();
        if (hoje.equals(user.getDataUltimoDesafioCompletado())) return Collections.singletonMap("sucesso", false);

        user.setXp(user.getXp() + payload.getOrDefault("xp", 50));
        user.setMoedas(user.getMoedas() + 50);
        user.setDataUltimoDesafioCompletado(hoje);
        usuarioRepository.save(user);

        return Collections.singletonMap("sucesso", true);
    }
}