package com.example.tcc.service;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UsuarioService {
    
    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Utilizador não autenticado");
        }
        String email = auth.getName();
        return usuarioRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilizador não encontrado"));
    }

    public void verificarResetDiario(Usuario user) {
        LocalDate hoje = LocalDate.now();
        if (user.getDataEstatisticas() == null || !hoje.equals(user.getDataEstatisticas())) {
            user.setDataEstatisticas(hoje);
            user.setCheckinsHoje(0);
            user.setFasesConcluidasHoje(0);
            user.setMaiorComboHoje(0);
            user.setFasesPerfeitasHoje(0);
            usuarioRepository.save(user);
        }
    }

    public void atualizarAvatar(String avatar) {
        Usuario user = getCurrentUser();
        user.setAvatar(avatar);
        usuarioRepository.save(user);
    }

    public Map<String, String> carregarProgresso() {
        return getCurrentUser().getStatusDasFases();
    }

    public Map<String, Object> carregarPerfil() {
        Usuario user = getCurrentUser();
        verificarResetDiario(user);

        if ("ROLE_ADMIN".equals(user.getRole())) {
            user.setMoedas(9999999);
            usuarioRepository.save(user);
        }

        Map<String, Object> perfil = new HashMap<>();
        perfil.put("nome", user.getNome());
        perfil.put("xp", user.getXp());
        perfil.put("nivel", user.getNivel());
        perfil.put("xpProximoNivel", user.getNivel() * 100);
        perfil.put("streak", user.getStreakDiaria());
        perfil.put("fasesPerfeitas", new ArrayList<>(user.getFasesPerfeitas())); 
        perfil.put("emblemas", new ArrayList<>(user.getEmblemas()));
        perfil.put("avatar", user.getAvatar() != null ? user.getAvatar() : "👨‍🎓");
        perfil.put("itensComprados", user.getItensComprados() != null ? new ArrayList<>(user.getItensComprados()) : new ArrayList<>());
        perfil.put("totalAcertos", user.getTotalAcertos());
        perfil.put("totalErros", user.getTotalErros());
        perfil.put("desafiosVencidos", user.getDesafiosVencidos());
        perfil.put("desafioConcluidoHoje", LocalDate.now().equals(user.getDataUltimoDesafioCompletado()));
        perfil.put("jaFezCheckinHoje", user.getCheckinsHoje() > 0);
        perfil.put("role", user.getRole());
        perfil.put("moedas", user.getMoedas());
        perfil.put("liga", user.getLiga() != null ? user.getLiga() : "FERRO");
        
        return perfil;
    }

    public Map<String, List<Map<String, Object>>> carregarRanking(String avatarIgnorado) {
        Usuario currentUser = getCurrentUser();
        List<Usuario> todosUsuarios = usuarioRepository.findAll();
        
        List<Map<String, Object>> rankingNivel = new ArrayList<>();

        for (Usuario u : todosUsuarios) {
            Map<String, Object> uData = new HashMap<>();
            boolean isCurrent = u.getId().equals(currentUser.getId());
            uData.put("nome", isCurrent ? "Você" : u.getNome());
            uData.put("avatar", u.getAvatar() != null ? u.getAvatar() : "👨‍🎓");
            uData.put("nivel", u.getNivel());
            uData.put("xp", u.getXp());
            uData.put("ofensiva", u.getStreakDiaria());
            uData.put("fases", u.getStatusDasFases().size());
            uData.put("isCurrentUser", isCurrent);
            uData.put("liga", u.getLiga() != null ? u.getLiga() : "FERRO");
            
            rankingNivel.add(uData);
        }

        rankingNivel.sort((a, b) -> Integer.compare((int) b.get("xp"), (int) a.get("xp")));

        Map<String, List<Map<String, Object>>> response = new HashMap<>();
        response.put("nivel", rankingNivel);
        return response;
    }

    public Map<Long, Integer> getHeatmapData() {
        Usuario user = getCurrentUser();
        Map<Long, Integer> heatmap = new HashMap<>();
        user.getLogAtividade().forEach((date, count) -> {
            long timestamp = date.atStartOfDay(ZoneId.systemDefault()).toEpochSecond();
            heatmap.put(timestamp, count);
        });
        return heatmap;
    }
}