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

    // Suporte para a imagem gigante em Base64
    @Column(name = "imagem_url", columnDefinition = "TEXT")
    private String imagemUrl;

    @Column(name = "alternativa_a", columnDefinition = "TEXT")
    private String alternativaA;

    @Column(name = "alternativa_b", columnDefinition = "TEXT")
    private String alternativaB;

    @Column(name = "alternativa_c", columnDefinition = "TEXT")
    private String alternativaC;

    @Column(name = "alternativa_d", columnDefinition = "TEXT")
    private String alternativaD;

    @Column(name = "resposta_correta", columnDefinition = "TEXT")
    private String respostaCorreta;

    @Column(name = "is_desafio")
    @JsonProperty("isDesafio")
    private boolean isDesafio = false;

    // CORREÇÃO: Inicializado com 0 para evitar erro de nulidade no banco
    @Column(name = "tempo_desafio")
    private Integer tempoDesafio = 0;

    // CORREÇÃO: Inicializado com 0 para evitar erro de nulidade no banco
    @Column(name = "xp_extra")
    private Integer xpExtra = 0;

    // Garante que o Jackson e o banco compreendam a variável isDesafio de forma idêntica
    public boolean getIsDesafio() {
        return this.isDesafio;
    }
}