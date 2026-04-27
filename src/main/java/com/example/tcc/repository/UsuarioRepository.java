package com.example.tcc.repository;

import com.example.tcc.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

// Busca usuários da mesma liga ordenados pelo XP acumulado na temporada atual
    Page<Usuario> findByLigaOrderByXpTemporadaDesc(String liga, Pageable pageable);
    
    // Busca por XP vitalício (histórico)
    Page<Usuario> findByLigaOrderByXpDesc(String liga, Pageable pageable);

    
}