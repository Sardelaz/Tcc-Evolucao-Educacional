package com.example.tcc.repository;

import com.example.tcc.domain.Conquista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConquistaRepository extends JpaRepository<Conquista, Long> {
}