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

    @Column(name = "especial")
    private Boolean especial;

    @NotEmpty(message = "A fase deve conter pelo menos uma questão")
    @Valid
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "fase_id")
    private List<Questao> questoes;

    // RESOLUÇÃO DO ERRO 500:
    // Sobrescrevemos o getEspecial gerado pelo Lombok.
    // Isso impede que o Jackson fique confuso sobre qual método chamar para gerar o JSON 
    // e garante a segurança contra NullPointerException.
    public Boolean getEspecial() {
        return this.especial != null ? this.especial : false;
    }
}