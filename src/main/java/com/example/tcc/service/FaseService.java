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
import java.util.Optional;

@Slf4j
@Service
public class FaseService {
    private final FaseRepository faseRepository;

    public FaseService(FaseRepository faseRepository) {
        this.faseRepository = faseRepository;
    }

    @Transactional
    public void salvarFase(String modulo, Fase novaFase) {
        log.info("Iniciando processo de salvamento da fase {} do módulo {}", novaFase.getFase(), modulo);
        
        validarQuestoes(novaFase.getQuestoes());

        novaFase.setModulo(modulo);
        sanitizarDadosFase(novaFase);

        faseRepository.findByModuloAndFase(modulo, novaFase.getFase())
                .ifPresent(faseExistente -> {
                    log.info("Fase {} já existente no módulo {}. Deletando versão antiga para atualizar.", novaFase.getFase(), modulo);
                    faseRepository.delete(faseExistente);
                    faseRepository.flush(); 
                });
        
        faseRepository.save(novaFase);
        log.info("Fase {} do módulo {} salva com sucesso!", novaFase.getFase(), modulo);
    }

    @Transactional(readOnly = true)
    public int buscarProximaFase(String modulo) {
        List<Fase> fases = faseRepository.findByModuloOrderByFaseAsc(modulo);
        if (fases.isEmpty()) {
            return 1;
        }
        int ultimaFase = fases.get(fases.size() - 1).getFase();
        return ultimaFase + 1;
    }

    private void validarQuestoes(List<Questao> questoes) {
        if (questoes == null || questoes.isEmpty()) return;
        
        for (Questao q : questoes) {
            if ("discursiva".equalsIgnoreCase(q.getTipo())) continue;

            Set<String> alternativasUnicas = new HashSet<>();
            int preenchidas = 0;

            String[] opcoes = {q.getAlternativaA(), q.getAlternativaB(), q.getAlternativaC(), q.getAlternativaD()};
            for (String opcao : opcoes) {
                if (opcao != null && !opcao.trim().isEmpty()) {
                    preenchidas++;
                    alternativasUnicas.add(opcao.trim().toLowerCase());
                }
            }

            if (alternativasUnicas.size() < preenchidas) {
                throw new IllegalArgumentException("A questão '" + q.getEnunciado() + "' contém alternativas repetidas.");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Fase> carregarFases(String modulo) {
        List<Fase> fases = faseRepository.findByModuloOrderByFaseAsc(modulo);
        fases.forEach(this::sanitizarDadosFase);
        return fases;
    }

    @Transactional(readOnly = true)
    public Fase carregarFaseEspecifica(String modulo, int faseNum) {
        Optional<Fase> faseOpt = faseRepository.findByModuloAndFase(modulo, faseNum);
        faseOpt.ifPresent(this::sanitizarDadosFase);
        return faseOpt.orElse(null);
    }

    private void sanitizarDadosFase(Fase fase) {
        if (fase == null) return;
        if (fase.getQuestoes() != null) {
            fase.getQuestoes().forEach(q -> {
                if (q.getImagemUrl() != null) {
                    q.setImagemUrl(sanitizarUrl(q.getImagemUrl()));
                }
            });
        }
    }

    private String sanitizarUrl(String url) {
        if (url == null || url.isEmpty()) return null;
        return url.replace("\"", "")
                  .replace("{", "")
                  .replace("}", "")
                  .replace("url:", "")
                  .trim();
    }

    @Transactional
    public void deletarFase(String modulo, int faseNum) {
        faseRepository.findByModuloAndFase(modulo, faseNum).ifPresent(faseRepository::delete);
    }

    public boolean verificarSimilaridade(String respostaUsuario, String respostaCorreta, double limite) {
        if (respostaUsuario == null || respostaCorreta == null) return false;
        
        String s1 = normalizarTexto(respostaUsuario);
        String s2 = normalizarTexto(respostaCorreta);
        
        if (s1.equals(s2)) return true;
        
        int distancia = calcularLevenshtein(s1, s2);
        int maiorTamanho = Math.max(s1.length(), s2.length());
        
        if (maiorTamanho == 0) return true;
        
        double similaridade = 1.0 - ((double) distancia / maiorTamanho);
        return similaridade >= limite;
    }

    private String normalizarTexto(String texto) {
        if (texto == null) return "";
        String nfdNormalizedString = Normalizer.normalize(texto.trim().toLowerCase(), Normalizer.Form.NFD);
        return nfdNormalizedString.replaceAll("[\\u0300-\\u036f]", "");
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