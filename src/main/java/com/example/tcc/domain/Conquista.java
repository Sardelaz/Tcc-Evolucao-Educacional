package com.example.tcc.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Conquista {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nome;
    private String descricao;
    private String icone; // Armazena o Emoji ou código do ícone
    
    // Tipo de regra: XP, NIVEL, OFENSIVA, PERFEITAS, DESAFIOS
    private String tipoRequisito; 
    
    // Valor necessário para desbloquear (Ex: 1000 para XP, 10 para Nível)
    private int valorObjetivo;
}