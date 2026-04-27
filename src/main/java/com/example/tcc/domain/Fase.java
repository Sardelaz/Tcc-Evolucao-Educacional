package com.example.tcc.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "fase")
public class Fase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String modulo; 

    @Min(value = 1, message = "O número da fase deve ser pelo menos 1")
    private int fase;

    @Min(value = 1, message = "A quantidade de questões deve ser pelo menos 1")
    private int qtd;

    // Link opcional para a videoaula de reforço
    private String videoAulaUrl;

    // CORREÇÃO: Usar a classe Wrapper "Boolean" no lugar do primitivo "boolean".
    // O banco de dados agora aceita valores nulos para fases que já existiam, 
    // resolvendo o erro PSQLException e o Erro 500 em produção.
    @Column(name = "especial")
    private Boolean especial;

    @NotEmpty(message = "A fase deve conter pelo menos uma questão")
    @Valid
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "fase_id")
    private List<Questao> questoes;

    // Garante a leitura correta no frontend e evita NullPointerException.
    // Se a fase for antiga e a coluna estiver nula no banco, ele assume false.
    @JsonProperty("especial")
    public boolean isEspecial() {
        return this.especial != null && this.especial;
    }
}