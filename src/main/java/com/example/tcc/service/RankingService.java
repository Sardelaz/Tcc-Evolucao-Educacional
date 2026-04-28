package com.example.tcc.service;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
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

    public Map<String, Object> carregarRankingPaginado(int page, int size, String avatar, String ligaParam) {
        Usuario currentUser = usuarioService.getCurrentUser();
        
        // Define qual liga deve ser renderizada: a solicitada pela aba ou a do usuário atual
        String ligaAlvo = (ligaParam != null && !ligaParam.trim().isEmpty()) 
                          ? ligaParam 
                          : currentUser.getLiga(); 
        
        // Garante que a liga nunca seja nula
        if (ligaAlvo == null || ligaAlvo.trim().isEmpty()) {
            ligaAlvo = "FERRO";
        }
        
        // Busca todos e filtra na memória do Java.
        List<Usuario> todosUsuarios = usuarioRepository.findAll();
        List<Usuario> usuariosDaLiga = new ArrayList<>();
        
        for (Usuario u : todosUsuarios) {
            // CORREÇÃO: Compara a String corretamente para ocultar administradores/professores do ranking
            if ("ROLE_ADMIN".equals(u.getRole())) {
                continue;
            }

            String ligaUser = u.getLiga();
            if (ligaUser == null || ligaUser.trim().isEmpty()) {
                ligaUser = "FERRO"; // Trata usuários antigos do banco
            }
            
            if (ligaUser.equalsIgnoreCase(ligaAlvo)) {
                usuariosDaLiga.add(u);
            }
        }
        
        // Ordenação pelo XP Real
        usuariosDaLiga.sort((a, b) -> Integer.compare(b.getXp(), a.getXp()));
        
        // Paginação Manual Segura
        int totalUsuarios = usuariosDaLiga.size();
        int totalPages = (int) Math.ceil((double) totalUsuarios / size);
        
        int start = Math.min(page * size, totalUsuarios);
        int end = Math.min(start + size, totalUsuarios);
        
        List<Usuario> usuariosPaginados = usuariosDaLiga.subList(start, end);

        Map<String, Object> response = new HashMap<>();
        response.put("usuarios", mapearUsuarios(usuariosPaginados, currentUser, avatar));
        response.put("currentPage", page);
        response.put("totalPages", totalPages == 0 ? 1 : totalPages);
        response.put("liga", ligaAlvo);
        response.put("totalJogadoresLiga", totalUsuarios);
        
        response.put("requisitos", obterRequisitosLiga(ligaAlvo));
        response.put("dataFimCiclo", calcularFimCiclo());

        return response;
    }

    private List<Map<String, Object>> mapearUsuarios(List<Usuario> usuarios, Usuario currentUser, String avatarParam) {
        List<Map<String, Object>> listaMapeada = new ArrayList<>();
        for (Usuario u : usuarios) {
            Map<String, Object> uData = new HashMap<>();
            boolean isCurrent = u.getId().equals(currentUser.getId());
            
            uData.put("nome", isCurrent ? "Você" : (u.getNome() != null && !u.getNome().isEmpty() ? u.getNome() : "Estudante"));
            uData.put("avatar", isCurrent ? avatarParam : (u.getAvatar() != null ? u.getAvatar() : "👨‍🎓"));
            uData.put("nivel", u.getNivel());
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

    public Map<String, Object> obterRequisitosLiga(String ligaAtual) {
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