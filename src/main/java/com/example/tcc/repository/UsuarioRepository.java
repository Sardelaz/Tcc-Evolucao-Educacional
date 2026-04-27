package com.example.tcc.repository;

import com.example.tcc.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    Optional<Usuario> findByEmail(String email);
    
    // Métodos opcionais mantidos para retrocompatibilidade
    Page<Usuario> findByLigaOrderByXpDesc(String liga, Pageable pageable);
    Page<Usuario> findByLigaOrderByXpTemporadaDesc(String liga, Pageable pageable);
}