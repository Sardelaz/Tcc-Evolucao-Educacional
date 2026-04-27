package com.example.tcc.controller;

import com.example.tcc.domain.Conquista;
import com.example.tcc.repository.ConquistaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conquistas")
public class ConquistaController {

    private final ConquistaRepository repo;

    public ConquistaController(ConquistaRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Conquista> listar() {
        return repo.findAll();
    }

    @PostMapping
    public Conquista salvar(@RequestBody Conquista c) {
        return repo.save(c);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Conquista> buscarPorId(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Conquista> atualizar(@PathVariable Long id, @RequestBody Conquista conquista) {
        return repo.findById(id).map(existente -> {
            existente.setNome(conquista.getNome());
            existente.setDescricao(conquista.getDescricao());
            existente.setTipoRequisito(conquista.getTipoRequisito());
            existente.setValorObjetivo(conquista.getValorObjetivo());
            existente.setIcone(conquista.getIcone());
            return ResponseEntity.ok(repo.save(existente));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}