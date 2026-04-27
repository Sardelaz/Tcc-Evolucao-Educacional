package com.example.tcc.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.*;

@Data
@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String nome;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    private String senha;
    private String avatar;
    
    private int xp; // XP Vitalício
    private int nivel;
    private int streakDiaria;
    private String role = "ROLE_ALUNO";

    private int moedas = 0; 
    private String liga = "FERRO"; 
    
    // XP acumulado apenas na semana atual
    private int xpTemporada = 0;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "usuario_status_fases", joinColumns = @JoinColumn(name = "usuario_id"))
    @MapKeyColumn(name = "fase_id")
    @Column(name = "status")
    private Map<String, String> statusDasFases = new HashMap<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "usuario_fases_perfeitas", joinColumns = @JoinColumn(name = "usuario_id"))
    @Column(name = "fase_id")
    private Set<String> fasesPerfeitas = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_emblemas", joinColumns = @JoinColumn(name = "usuario_id"))
    @Column(name = "emblema")
    private Set<String> emblemas = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_itens_comprados", joinColumns = @JoinColumn(name = "usuario_id"))
    @Column(name = "item_id")
    private Set<String> itensComprados = new HashSet<>();

    private LocalDate dataUltimoDesafioCompletado;
    private LocalDate dataEstatisticas;
    
    private int checkinsHoje = 0;
    private int fasesConcluidasHoje = 0;
    private int maiorComboHoje = 0;
    private int fasesPerfeitasHoje = 0;

    private int totalAcertos = 0;
    private int totalErros = 0;
    private int desafiosVencidos = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_erros_recentes", joinColumns = @JoinColumn(name = "usuario_id"))
    @Column(name = "detalhe_erro")
    private List<String> ultimasQuestoesErradas = new ArrayList<>();

    private int totalQuestoesRespondidas = 0;
    private int totalSimuladosConcluidos = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuario_atividade_log", joinColumns = @JoinColumn(name = "usuario_id"))
    @MapKeyColumn(name = "data_atividade")
    @Column(name = "quantidade")
    private Map<LocalDate, Integer> logAtividade = new HashMap<>();
}