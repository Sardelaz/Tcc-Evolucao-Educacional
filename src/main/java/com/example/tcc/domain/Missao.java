package com.example.tcc.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Missao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descricao;
    private String tipo; // "DIARIA" ou "SEMANAL"
    private String categoria; // "ACERTOS", "FASES", "MOEDAS"
    private int objetivo;
    private int recompensaXp;
    private int recompensaMoedas;
}