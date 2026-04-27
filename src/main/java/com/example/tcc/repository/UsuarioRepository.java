package com.example.tcc.repository;

import com.example.tcc.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    Optional<Usuario> findByEmail(String email);
    
    // CORREÇÃO CRÍTICA PARA PRODUÇÃO: COALESCE garante que usuários antigos (liga = NULL) sejam lidos como 'FERRO'
    @Query("SELECT u FROM Usuario u WHERE COALESCE(u.liga, 'FERRO') = :liga ORDER BY u.xp DESC")
    Page<Usuario> findByLigaOrderByXpDesc(@Param("liga") String liga, Pageable pageable);
    
    @Query("SELECT u FROM Usuario u WHERE COALESCE(u.liga, 'FERRO') = :liga ORDER BY u.xpTemporada DESC")
    Page<Usuario> findByLigaOrderByXpTemporadaDesc(@Param("liga") String liga, Pageable pageable);
}