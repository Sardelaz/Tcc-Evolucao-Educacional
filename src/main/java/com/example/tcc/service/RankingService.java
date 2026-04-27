package com.example.tcc.service;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class RankingService {
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    public RankingService(UsuarioRepository usuarioRepository, UsuarioService usuarioService) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
    }

    public Map<String, Object> carregarRankingPaginado(int page, int size, String avatar) {
        Usuario currentUser = usuarioService.getCurrentUser();
        String ligaDoUsuario = currentUser.getLiga(); 
        
        PageRequest pageRequest = PageRequest.of(page, size);

        Page<Usuario> paginaUsuarios = usuarioRepository.findByLigaOrderByXpDesc(ligaDoUsuario, pageRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("usuarios", mapearUsuarios(paginaUsuarios.getContent(), currentUser, avatar));
        response.put("currentPage", page);
        response.put("totalPages", paginaUsuarios.getTotalPages());
        response.put("liga", ligaDoUsuario);
        response.put("totalJogadoresLiga", paginaUsuarios.getTotalElements());

        return response;
    }

    private List<Map<String, Object>> mapearUsuarios(List<Usuario> usuarios, Usuario currentUser, String avatarParam) {
        List<Map<String, Object>> listaMapeada = new ArrayList<>();
        for (Usuario u : usuarios) {
            Map<String, Object> uData = new HashMap<>();
            boolean isCurrent = u.getId().equals(currentUser.getId());
            uData.put("nome", isCurrent ? "Você" : u.getNome());
            uData.put("avatar", isCurrent ? avatarParam : u.getAvatar());
            uData.put("nivel", u.getNivel());
            // CORREÇÃO: O ranking agora puxa o xpTemporada em vez do XP vitalício
            uData.put("xp", u.getXpTemporada()); 
            uData.put("isCurrentUser", isCurrent);
            listaMapeada.add(uData);
        }
        return listaMapeada;
    }
}