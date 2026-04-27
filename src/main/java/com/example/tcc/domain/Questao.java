package com.example.tcc.domain;

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
    @Column(name = "is_desafio")
    private boolean isDesafio = false;
    
    @Column(name = "tempo_desafio")
    private Integer tempoDesafio; // Armazenado em segundos
    
    @Column(name = "xp_extra")
    private Integer xpExtra;
}