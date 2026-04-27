package com.example.tcc.service;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
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
        
        // Proteção extra caso o próprio usuário logado tenha liga nula
        if (ligaDoUsuario == null || ligaDoUsuario.trim().isEmpty()) {
            ligaDoUsuario = "FERRO";
        }
        
        PageRequest pageRequest = PageRequest.of(page, size);
        
        // Utiliza a query customizada que corrige o problema do banco de produção
        Page<Usuario> paginaUsuarios = usuarioRepository.findByLigaOrderByXpDesc(ligaDoUsuario, pageRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("usuarios", mapearUsuarios(paginaUsuarios.getContent(), currentUser, avatar));
        response.put("currentPage", page);
        response.put("totalPages", paginaUsuarios.getTotalPages());
        response.put("liga", ligaDoUsuario);
        response.put("totalJogadoresLiga", paginaUsuarios.getTotalElements());
        
        response.put("requisitos", obterRequisitosLiga(ligaDoUsuario));
        response.put("dataFimCiclo", calcularFimCiclo());

        return response;
    }

    private List<Map<String, Object>> mapearUsuarios(List<Usuario> usuarios, Usuario currentUser, String avatarParam) {
        List<Map<String, Object>> listaMapeada = new ArrayList<>();
        for (Usuario u : usuarios) {
            Map<String, Object> uData = new HashMap<>();
            boolean isCurrent = u.getId().equals(currentUser.getId());
            uData.put("nome", isCurrent ? "Você" : u.getNome());
            
            // Garante que usuários antigos sem avatar tenham um avatar padrão para não quebrar a UI
            uData.put("avatar", isCurrent ? avatarParam : (u.getAvatar() != null ? u.getAvatar() : "👨‍🎓"));
            
            uData.put("nivel", u.getNivel());
            // CORREÇÃO: Utiliza u.getXp() para garantir o XP Real igual ao do perfil e não retornar 0
            uData.put("xp", u.getXp()); 
            
            uData.put("isCurrentUser", isCurrent);
            listaMapeada.add(uData);
        }
        return listaMapeada;
    }

    private String calcularFimCiclo() {
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime fimCiclo = agora.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY))
                                      .withHour(23).withMinute(59).withSecond(59);
        
        if (agora.isAfter(fimCiclo)) {
            fimCiclo = fimCiclo.plusWeeks(1);
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");
        return fimCiclo.format(formatter);
    }

    private Map<String, Object> obterRequisitosLiga(String ligaAtual) {
        Map<String, Object> req = new HashMap<>();
        switch (ligaAtual) {
            case "FERRO":
                req.put("proximaLiga", "BRONZE");
                req.put("promocaoTop", 5);
                req.put("rebaixamentoPos", 0);
                req.put("descricao", "Fique no Top 5 para subir de liga!");
                break;
            case "BRONZE":
                req.put("proximaLiga", "PRATA");
                req.put("promocaoTop", 5);
                req.put("rebaixamentoPos", 15);
                req.put("descricao", "Top 5 sobem. Abaixo de 15º volta para o Ferro.");
                break;
            case "PRATA":
                req.put("proximaLiga", "OURO");
                req.put("promocaoTop", 3);
                req.put("rebaixamentoPos", 12);
                req.put("descricao", "Top 3 sobem. Abaixo de 12º volta para o Bronze.");
                break;
            case "OURO":
                req.put("proximaLiga", "DIAMANTE");
                req.put("promocaoTop", 3);
                req.put("rebaixamentoPos", 10);
                req.put("descricao", "Top 3 sobem. Abaixo de 10º volta para a Prata.");
                break;
            case "DIAMANTE":
                req.put("proximaLiga", "LENDA");
                req.put("promocaoTop", 1);
                req.put("rebaixamentoPos", 8);
                req.put("descricao", "Apenas o 1º sobe. Abaixo de 8º volta para o Ouro.");
                break;
            default:
                req.put("proximaLiga", "MÁXIMA");
                req.put("promocaoTop", 0);
                req.put("rebaixamentoPos", 5);
                req.put("descricao", "Você está no topo!");
                break;
        }
        return req;
    }
}