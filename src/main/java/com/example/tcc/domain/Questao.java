package com.example.tcc.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "questao")
public class Questao {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;
    
    @Column(columnDefinition = "TEXT")
    private String enunciado;
    
    @Column(name = "imagem_url")
    private String imagemUrl;
    
    @Column(name = "alternativa_a")
    private String alternativaA;
    
    @Column(name = "alternativa_b")
    private String alternativaB;
    
    @Column(name = "alternativa_c")
    private String alternativaC;
    
    @Column(name = "alternativa_d")
    private String alternativaD;
    
    @Column(name = "resposta_correta")
    private String respostaCorreta;

    // Funcionalidade de Desafio
    // O JsonProperty resolve o bug de conversão do Jackson/Lombok para campos booleanos
    @Column(name = "is_desafio")
    @JsonProperty("isDesafio")
    private boolean isDesafio = false;
    
    @Column(name = "tempo_desafio")
    private Integer tempoDesafio; // Armazenado em segundos
    
    @Column(name = "xp_extra")
    private Integer xpExtra;
}