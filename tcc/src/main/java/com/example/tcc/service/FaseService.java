package com.example.tcc.service;

import com.example.tcc.domain.Fase;
import com.example.tcc.repository.FaseRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FaseService {
    private final FaseRepository faseRepository;

    public FaseService(FaseRepository faseRepository) {
        this.faseRepository = faseRepository;
    }

    public void salvarFase(String modulo, Fase novaFase) {
        novaFase.setModulo(modulo);
        // Se a fase já existir, a deleta para sobrescrever
        faseRepository.findByModuloAndFase(modulo, novaFase.getFase())
                .ifPresent(faseRepository::delete);
        
        faseRepository.save(novaFase);
    }

    public List<Fase> carregarFases(String modulo) {
        return faseRepository.findByModuloOrderByFaseAsc(modulo);
    }

    public Fase carregarFaseEspecifica(String modulo, int faseId) {
        return faseRepository.findByModuloAndFase(modulo, faseId).orElse(null);
    }
}