package com.example.tcc.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Modulo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String slug; // Identificador URL, ex: razao_e_proporcao
    
    @Column(nullable = false)
    private String nome; // Nome de exibição, ex: Razão e Proporção
    
    private String icone; // Emoji cadastrado pelo professor
    private String cor; // Código Hexadecimal da cor para estampar no layout
}