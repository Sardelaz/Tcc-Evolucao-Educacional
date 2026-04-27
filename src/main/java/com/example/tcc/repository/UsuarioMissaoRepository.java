package com.example.tcc.repository;

import com.example.tcc.domain.Usuario;
import com.example.tcc.domain.UsuarioMissao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsuarioMissaoRepository extends JpaRepository<UsuarioMissao, Long> {
    List<UsuarioMissao> findByUsuarioAndConcluidaFalse(Usuario usuario);
    List<UsuarioMissao> findByUsuario(Usuario usuario);

    @Query("SELECT um FROM UsuarioMissao um JOIN um.missao m WHERE um.usuario = :usuario AND m.tipo = :tipo")
    List<UsuarioMissao> findByUsuarioAndTipoMissao(@Param("usuario") Usuario usuario, @Param("tipo") String tipo);
}