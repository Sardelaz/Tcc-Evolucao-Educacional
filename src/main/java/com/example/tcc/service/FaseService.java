package com.example.tcc.service;

import com.example.tcc.domain.Fase;
import com.example.tcc.domain.Questao;
import com.example.tcc.repository.FaseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class FaseService {
    private final FaseRepository faseRepository;

    public FaseService(FaseRepository faseRepository) {
        this.faseRepository = faseRepository;
    }

    @Transactional
    public void salvarFase(String modulo, Fase novaFase) {
        log.info("Processando salvamento da fase {} do módulo {}", novaFase.getFase(), modulo);
        validarQuestoes(novaFase.getQuestoes());
        novaFase.setModulo(modulo);
        sanitizarDadosFase(novaFase);

        Fase faseExistente = faseRepository.findByModuloAndFase(modulo, novaFase.getFase()).orElse(null);

        if (faseExistente != null) {
            // Atualiza os dados da fase existente para manter o ID intacto sem violar a validação
            faseExistente.setQtd(novaFase.getQtd());
            faseExistente.setVideoAulaUrl(novaFase.getVideoAulaUrl());
            faseExistente.setEspecial(novaFase.getEspecial());
            
            // Limpa as questões antigas e adiciona as novas na mesma transação.
            // O Hibernate lidará com o "orphanRemoval" de forma segura no final do processo,
            // garantindo que a validação @NotEmpty passe com sucesso.
            if (faseExistente.getQuestoes() != null) {
                faseExistente.getQuestoes().clear();
                if (novaFase.getQuestoes() != null) {
                    faseExistente.getQuestoes().addAll(novaFase.getQuestoes());
                }
            } else {
                faseExistente.setQuestoes(novaFase.getQuestoes());
            }
            
            faseRepository.save(faseExistente);
        } else {
            // Se não existir, salva como nova fase
            faseRepository.save(novaFase);
        }
    }

    @Transactional(readOnly = true)
    public int buscarProximaFase(String modulo) {
        List<Fase> fases = faseRepository.findByModuloOrderByFaseAsc(modulo);
        return fases.isEmpty() ? 1 : fases.get(fases.size() - 1).getFase() + 1;
    }

    private void validarQuestoes(List<Questao> questoes) {
        if (questoes == null) return;
        for (Questao q : questoes) {
            if ("discursiva".equalsIgnoreCase(q.getTipo())) continue;
            Set<String> unicas = new HashSet<>();
            String[] opcoes = {q.getAlternativaA(), q.getAlternativaB(), q.getAlternativaC(), q.getAlternativaD()};
            for (String o : opcoes) if (o != null && !o.trim().isEmpty()) unicas.add(o.trim().toLowerCase());
            if (unicas.size() < 2 && !"discursiva".equalsIgnoreCase(q.getTipo())) {
                 log.warn("Alternativas repetidas ou insuficientes na questão: {}", q.getEnunciado());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Fase> carregarFases(String modulo) {
        return faseRepository.findByModuloOrderByFaseAsc(modulo);
    }

    @Transactional(readOnly = true)
    public Fase carregarFaseEspecifica(String modulo, int faseNum) {
        return faseRepository.findByModuloAndFase(modulo, faseNum).orElse(null);
    }

    private void sanitizarDadosFase(Fase fase) {
        if (fase != null && fase.getQuestoes() != null) {
            fase.getQuestoes().forEach(q -> {
                if (q.getImagemUrl() != null) {
                    q.setImagemUrl(sanitizarUrl(q.getImagemUrl()));
                }
            });
        }
    }

    private String sanitizarUrl(String url) {
        if (url == null) return null;
        if (url.startsWith("data:")) return url.trim();
        return url.replace("\"", "").replace("{", "").replace("}", "").replace("url:", "").trim();
    }

    @Transactional
    public void deletarFase(String modulo, int faseNum) {
        faseRepository.findByModuloAndFase(modulo, faseNum).ifPresent(faseRepository::delete);
    }

    public boolean verificarSimilaridade(String respUser, String respCorrect, double limite) {
        if (respUser == null || respCorrect == null) return false;
        String s1 = normalizarTexto(respUser);
        String s2 = normalizarTexto(respCorrect);
        if (s1.equals(s2)) return true;
        int dist = calcularLevenshtein(s1, s2);
        int maxLen = Math.max(s1.length(), s2.length());
        return maxLen == 0 ? true : (1.0 - ((double) dist / maxLen)) >= limite;
    }

    private String normalizarTexto(String t) {
        if (t == null) return "";
        return Normalizer.normalize(t.trim().toLowerCase(), Normalizer.Form.NFD).replaceAll("[\\u0300-\\u036f]", "");
    }

    private int calcularLevenshtein(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) dp[i][j] = j;
                else if (j == 0) dp[i][j] = i;
                else {
                    int custo = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                    dp[i][j] = Math.min(dp[i - 1][j - 1] + custo, Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1));
                }
            }
        }
        return dp[s1.length()][s2.length()];
    }
}