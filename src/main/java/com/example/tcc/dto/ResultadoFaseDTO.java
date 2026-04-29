package com.example.tcc.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
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
    
    // Lista de textos das questões que o usuário errou
    private List<String> enunciadosErrados;

    private int desafiosVencidosNestaFase;
    
    // ADIÇÃO: Total de desafios que existiam na fase para comparação
    private int totalDesafiosFase;

    private Map<String, Integer> acertosPorMateria;

    // ADIÇÃO: Vidas que sobraram ao finalizar
    private int vidasRestantes;
}