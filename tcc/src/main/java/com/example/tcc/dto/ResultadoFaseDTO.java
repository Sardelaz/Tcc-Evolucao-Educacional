package com.example.tcc.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.Map;

@Data
public class ResultadoFaseDTO {
    
    @NotBlank
    private String modulo;
    
    @Min(1)
    private int fase;
    
    @Min(value = 0, message = "Os acertos não podem ser negativos")
    private int acertos;
    
    private int erros;
    
    @Min(value = 0, message = "A sequência máxima (streak) não pode ser negativa")
    private int maxStreak;
    
    private int tempoSegundos;
    
    @Min(value = 1, message = "O total de questões deve ser no mínimo 1")
    private int totalQuestoes;
    
    // ANTI-CHEAT: Conta os desafios vencidos em vez de confiar no XP enviado pelo navegador
    private int desafiosVencidosNestaFase;

    // Feedback Detalhado para Simulados
    private Map<String, Integer> acertosPorMateria;
}