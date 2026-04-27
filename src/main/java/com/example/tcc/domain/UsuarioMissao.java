package com.example.tcc.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class UsuarioMissao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario usuario;

    @ManyToOne
    private Missao missao;

    private int progressoAtual;
    private boolean concluida;
    private boolean recompensaResgatada;
}