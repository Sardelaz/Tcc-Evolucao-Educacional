package com.example.tcc.service;

import com.example.tcc.domain.Fase;
import com.example.tcc.repository.FaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class FaseService {
    private final FaseRepository faseRepository;

    public FaseService(FaseRepository faseRepository) {
        this.faseRepository = faseRepository;
    }

    @Transactional
    public void salvarFase(String modulo, Fase novaFase) {
        novaFase.setModulo(modulo);
        // Remove a versão antiga para garantir que a nova tenha um ID único e reset de progresso
        faseRepository.findByModuloAndFase(modulo, novaFase.getFase())
                .ifPresent(faseRepository::delete);
        
        faseRepository.save(novaFase);
    }

    public List<Fase> carregarFases(String modulo) {
        return faseRepository.findByModuloOrderByFaseAsc(modulo);
    }

    public Fase carregarFaseEspecifica(String modulo, int faseNum) {
        return faseRepository.findByModuloAndFase(modulo, faseNum).orElse(null);
    }

    @Transactional
    public void deletarFase(String modulo, int faseNum) {
        faseRepository.findByModuloAndFase(modulo, faseNum)
                .ifPresent(faseRepository::delete);
    }
}