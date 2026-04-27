package com.example.tcc.domain;

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

    // Novo campo para identificar se a fase é especial (Bônus de XP e Moedas)
    private boolean especial;

    @NotEmpty(message = "A fase deve conter pelo menos uma questão")
    @Valid
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "fase_id")
    private List<Questao> questoes;
}