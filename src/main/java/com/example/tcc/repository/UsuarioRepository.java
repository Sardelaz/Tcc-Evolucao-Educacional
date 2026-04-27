package com.example.tcc.repository;

import com.example.tcc.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String> {

    Optional<Usuario> findByEmail(String email);

    List<Usuario> findTop50ByOrderByXpDesc();

    List<Usuario> findTop50ByOrderByStreakDiariaDesc();

    @Query("SELECT u FROM Usuario u ORDER BY SIZE(u.statusDasFases) DESC LIMIT 50")
    List<Usuario> findTop50ByOrderByFasesConcluidasDesc();

    @Query("SELECT u FROM Usuario u WHERE u.liga = :liga OR (u.liga IS NULL AND :liga = 'FERRO') ORDER BY u.xp DESC")
    Page<Usuario> findByLigaOrderByXpDesc(@Param("liga") String liga, Pageable pageable);
    
    @Query("SELECT u FROM Usuario u WHERE u.liga = :liga OR (u.liga IS NULL AND :liga = 'FERRO') ORDER BY u.xpTemporada DESC")
    Page<Usuario> findByLigaOrderByXpTemporadaDesc(@Param("liga") String liga, Pageable pageable);
}