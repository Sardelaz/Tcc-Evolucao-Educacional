package com.example.tcc.service;

import com.example.tcc.domain.*;
import com.example.tcc.dto.ResultadoFaseDTO;
import com.example.tcc.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
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
    private final UsuarioMissaoRepository usuarioMissaoRepository;
    private final MissaoRepository missaoRepository;

    public GamificacaoService(UsuarioRepository usuarioRepository, UsuarioService usuarioService,
            FaseRepository faseRepository, ConquistaRepository conquistaRepository, 
            UsuarioMissaoRepository usuarioMissaoRepository, MissaoRepository missaoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.faseRepository = faseRepository;
        this.conquistaRepository = conquistaRepository;
        this.usuarioMissaoRepository = usuarioMissaoRepository;
        this.missaoRepository = missaoRepository;
    }

    private void garantirMissoesBase() {
        if (missaoRepository.count() == 0) {
            criarMissao("Gênio da Semana: Acerte 50 questões", "SEMANAL", "ACERTOS", 50, 300, 150);
            criarMissao("Maratonista: Complete 10 fases na semana", "SEMANAL", "FASES", 10, 500, 200);
            criarMissao("Aquecimento: Acerte 10 questões hoje", "DIARIA", "ACERTOS", 10, 50, 20);
            criarMissao("Frequência: Faça check-in", "DIARIA", "CHECKIN", 1, 50, 10);
        }
    }

    private void criarMissao(String desc, String tipo, String cat, int obj, int xp, int moedas) {
        Missao m = new Missao();
        m.setDescricao(desc);
        m.setTipo(tipo);
        m.setCategoria(cat);
        m.setObjetivo(obj);
        m.setRecompensaXp(xp);
        m.setRecompensaMoedas(moedas);
        missaoRepository.save(m);
    }

    public void atribuirMissoesSeVazio(Usuario user) {
        garantirMissoesBase();
        List<UsuarioMissao> todasAtuais = usuarioMissaoRepository.findByUsuario(user);
        
        long diarias = todasAtuais.stream().filter(um -> "DIARIA".equals(um.getMissao().getTipo())).count();
        long semanais = todasAtuais.stream().filter(um -> "SEMANAL".equals(um.getMissao().getTipo())).count();

        if (diarias == 0 || semanais == 0) {
            List<Missao> todasMissoesDb = missaoRepository.findAll();
            for (Missao m : todasMissoesDb) {
                boolean jaTem = todasAtuais.stream().anyMatch(um -> um.getMissao().getId().equals(m.getId()));
                if (!jaTem) {
                    UsuarioMissao nova = new UsuarioMissao();
                    nova.setUsuario(user);
                    nova.setMissao(m);
                    nova.setProgressoAtual(0);
                    nova.setConcluida(false);
                    nova.setRecompensaResgatada(false);
                    usuarioMissaoRepository.save(nova);
                }
            }
        }
    }

    @Scheduled(cron = "0 0 0 * * MON")
    public void resetarTemporadaSemanal() {
        usuarioRepository.findAll().forEach(u -> {
            u.setXpTemporada(0);
            usuarioRepository.save(u);
        });
    }

    @Scheduled(cron = "0 0 0 * * MON")
    public void resetarMissoesSemanais() {
        usuarioRepository.findAll().forEach(u -> {
            usuarioMissaoRepository.deleteAll(usuarioMissaoRepository.findByUsuarioAndTipoMissao(u, "SEMANAL"));
            atribuirMissoesSeVazio(u);
        });
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void resetarMissoesDiarias() {
        usuarioRepository.findAll().forEach(u -> {
            usuarioMissaoRepository.deleteAll(usuarioMissaoRepository.findByUsuarioAndTipoMissao(u, "DIARIA"));
            atribuirMissoesSeVazio(u);
        });
    }

    public Map<String, Object> concluirFase(String lessonId, ResultadoFaseDTO resultado) {
        Usuario userSessao = usuarioService.getCurrentUser();
        Usuario user = usuarioRepository.findById(userSessao.getId()).orElse(userSessao);
        
        usuarioService.verificarResetDiario(user);
        atribuirMissoesSeVazio(user);

        Fase faseOriginal = faseRepository.findByModuloAndFase(resultado.getModulo(), resultado.getFase())
                .orElseThrow(() -> new RuntimeException("Fase não encontrada"));

        String chaveUnica = resultado.getModulo() + "_fase" + resultado.getFase() + "_id" + faseOriginal.getId();
        boolean jaEstavaConcluida = user.getStatusDasFases().containsKey(chaveUnica) && "completed".equals(user.getStatusDasFases().get(chaveUnica));

        if (resultado.getEnunciadosErrados() != null) {
            for (String enunciado : resultado.getEnunciadosErrados()) {
                user.getUltimasQuestoesErradas().add(0, String.format("[%s - F %d] %s", resultado.getModulo().toUpperCase(), resultado.getFase(), enunciado));
            }
            if (user.getUltimasQuestoesErradas().size() > 15) {
                user.setUltimasQuestoesErradas(new ArrayList<>(user.getUltimasQuestoesErradas().subList(0, 15)));
            }
        }

        user.getStatusDasFases().put(chaveUnica, "completed");

        int xpGanho = 0;
        int moedasGanhas = 0;

        if (!jaEstavaConcluida) {
            xpGanho = (resultado.getAcertos() * 10) + (resultado.getMaxStreak() * 5);
            // CORREÇÃO: Utilizando getEspecial() no lugar de isEspecial()
            if (faseOriginal.getEspecial()) xpGanho *= 2;

            // CORREÇÃO: Utilizando getEspecial() no lugar de isEspecial()
            moedasGanhas = Math.max(0, (faseOriginal.getEspecial() ? 50 : 30) - (resultado.getErros() * 5));

            user.setXp(user.getXp() + xpGanho);
            user.setXpTemporada(user.getXpTemporada() + xpGanho);
            user.setMoedas(user.getMoedas() + moedasGanhas);

            atualizarProgressoMissoes(user, "ACERTOS", resultado.getAcertos());
            atualizarProgressoMissoes(user, "FASES", 1);
        }

        user.setNivel((user.getXp() / 100) + 1);
        atualizarLiga(user); 
        verificarConquistas(user, resultado);
        usuarioRepository.save(user);

        return Map.of("xpGanho", xpGanho, "moedasGanhas", moedasGanhas, "nivel", user.getNivel(), "liga", user.getLiga());
    }

    private void atualizarProgressoMissoes(Usuario user, String categoria, int incremento) {
        usuarioMissaoRepository.findByUsuarioAndConcluidaFalse(user).stream()
            .filter(um -> um.getMissao().getCategoria().equals(categoria))
            .forEach(um -> {
                um.setProgressoAtual(Math.min(um.getProgressoAtual() + incremento, um.getMissao().getObjetivo()));
                if (um.getProgressoAtual() >= um.getMissao().getObjetivo()) {
                    um.setConcluida(true);
                    um.setRecompensaResgatada(true);
                    user.setXp(user.getXp() + um.getMissao().getRecompensaXp());
                    user.setXpTemporada(user.getXpTemporada() + um.getMissao().getRecompensaXp());
                    user.setMoedas(user.getMoedas() + um.getMissao().getRecompensaMoedas());
                }
                usuarioMissaoRepository.save(um);
            });
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
        if (user.getEmblemas() == null) user.setEmblemas(new HashSet<>());
        conquistaRepository.findAll().forEach(c -> {
            String badgeId = "dynamic_" + c.getId();
            if (!user.getEmblemas().contains(badgeId)) {
                boolean conquistou = switch (c.getTipoRequisito()) {
                    case "XP" -> user.getXp() >= c.getValorObjetivo();
                    case "NIVEL" -> user.getNivel() >= c.getValorObjetivo();
                    default -> false;
                };
                if (conquistou) user.getEmblemas().add(badgeId);
            }
        });
    }

    public Map<String, Object> fazerCheckin() {
        Usuario user = usuarioRepository.findById(usuarioService.getCurrentUser().getId()).orElseThrow();
        usuarioService.verificarResetDiario(user);
        atribuirMissoesSeVazio(user);

        if (user.getCheckinsHoje() > 0) return Map.of("sucesso", false);

        user.setCheckinsHoje(1);
        user.setStreakDiaria(user.getStreakDiaria() + 1);
        user.setXp(user.getXp() + 100);
        user.setXpTemporada(user.getXpTemporada() + 100);
        user.setMoedas(user.getMoedas() + 20); 
        user.setNivel((user.getXp() / 100) + 1);
        atualizarLiga(user);
        atualizarProgressoMissoes(user, "CHECKIN", 1);
        usuarioRepository.save(user);
        
        return Map.of("sucesso", true, "moedasTotais", user.getMoedas(), "xpTotal", user.getXp(), "nivel", user.getNivel());
    }

    public Map<String, Object> completarDesafioDiario(Map<String, Integer> payload) {
        Usuario user = usuarioRepository.findById(usuarioService.getCurrentUser().getId()).orElseThrow();
        usuarioService.verificarResetDiario(user);
        atribuirMissoesSeVazio(user);

        if (LocalDate.now().equals(user.getDataUltimoDesafioCompletado())) return Map.of("sucesso", false);

        int xp = payload.getOrDefault("xp", 50);
        user.setXp(user.getXp() + xp);
        user.setXpTemporada(user.getXpTemporada() + xp);
        user.setMoedas(user.getMoedas() + 50);
        user.setDataUltimoDesafioCompletado(LocalDate.now());
        atualizarProgressoMissoes(user, "DESAFIOS_DIARIOS", 1);
        usuarioRepository.save(user);

        return Map.of("sucesso", true, "moedasTotais", user.getMoedas(), "xpTotal", user.getXp());
    }
}