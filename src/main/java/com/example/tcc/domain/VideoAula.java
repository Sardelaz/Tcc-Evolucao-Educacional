package com.example.tcc.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class VideoAula {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String titulo;
    private String modulo;
    private String url;
}