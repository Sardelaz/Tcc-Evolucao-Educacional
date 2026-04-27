package com.example.tcc.repository;

import com.example.tcc.domain.Fase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FaseRepository extends JpaRepository<Fase, Long> {
    List<Fase> findByModuloOrderByFaseAsc(String modulo);
    Optional<Fase> findByModuloAndFase(String modulo, int fase);
}