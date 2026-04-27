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
        log.info("Iniciando processo de salvamento da fase {} do módulo {}", novaFase.getFase(), modulo);
        
        // 1. Validação de alternativas duplicadas
        validarQuestoes(novaFase.getQuestoes());

        novaFase.setModulo(modulo);
        
        // 2. Lógica de Sobrescrita (Correção do Erro 400)
        // Se a fase já existe, deletamos a versão anterior antes de salvar a nova.
        // Isso garante que as questões antigas sejam removidas (orphanRemoval) e o ID mude,
        // resetando o progresso conforme planejado na arquitetura do sistema.
        faseRepository.findByModuloAndFase(modulo, novaFase.getFase())
                .ifPresent(faseExistente -> {
                    log.info("Fase {} já existente no módulo {}. Deletando versão antiga para atualizar.", novaFase.getFase(), modulo);
                    faseRepository.delete(faseExistente);
                    // Forçamos o flush para garantir que a deleção ocorra antes da inserção da nova fase
                    faseRepository.flush(); 
                });
        
        faseRepository.save(novaFase);
        log.info("Fase {} do módulo {} salva com sucesso!", novaFase.getFase(), modulo);
    }

    // Calcula o próximo número de fase disponível para o módulo
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

    public List<Fase> carregarFases(String modulo) {
        return faseRepository.findByModuloOrderByFaseAsc(modulo);
    }

    public Fase carregarFaseEspecifica(String modulo, int faseNum) {
        return faseRepository.findByModuloAndFase(modulo, faseNum).orElse(null);
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