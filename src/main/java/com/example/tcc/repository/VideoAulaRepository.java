package com.example.tcc.repository;

import com.example.tcc.domain.VideoAula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoAulaRepository extends JpaRepository<VideoAula, Long> {
}