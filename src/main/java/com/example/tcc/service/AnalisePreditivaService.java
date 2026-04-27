package com.example.tcc.service;

import org.springframework.stereotype.Service;
import com.example.tcc.domain.Usuario;

@Service
public class AnalisePreditivaService {

    public double preverProximoDesempenho(Usuario usuario) {
        if (usuario.getLogAtividade() == null || usuario.getLogAtividade().isEmpty()) return 0.0;

        // Média das últimas atividades registradas no Heatmap
        return usuario.getLogAtividade().values().stream()
                .skip(Math.max(0, usuario.getLogAtividade().size() - 5))
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
    }

    public String sugerirFocoEstudo(Usuario usuario) {
        if (usuario.getXp() < 500) return "Praticar Módulos de Razão e Proporção";
        if (usuario.getTotalErros() > usuario.getTotalAcertos()) return "Revisar fundamentos básicos";
        return "Focar em Simulados Avançados e Desafios de Tempo";
    }
}