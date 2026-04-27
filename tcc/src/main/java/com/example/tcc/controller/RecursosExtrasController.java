package com.example.tcc.controller;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import com.example.tcc.service.UsuarioService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/extras")
public class RecursosExtrasController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    public RecursosExtrasController(UsuarioRepository usuarioRepository, UsuarioService usuarioService) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    @GetMapping("/admin/relatorio-alunos.csv")
    public void baixarRelatorioCSV(HttpServletResponse response) throws Exception {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"relatorio_alunos_evolucao.csv\"");
        
        PrintWriter writer = response.getWriter();
        writer.write('\ufeff');
        writer.println("Nome,Email,Role,Nível,XP,Moedas,Liga,Total Acertos,Total Erros,Fases Perfeitas");
        
        List<Usuario> alunos = usuarioRepository.findAll();
        for(Usuario u : alunos) {
            writer.println(String.format("%s,%s,%s,%d,%d,%d,%s,%d,%d,%d",
                    u.getNome(), u.getEmail(), u.getRole(), u.getNivel(), u.getXp(),
                    u.getMoedas(), u.getLiga(), u.getTotalAcertos(), u.getTotalErros(), u.getFasesPerfeitas().size()));
        }
    }

    // CORREÇÃO: Transacional adicionado para persistir coleções (@ElementCollection) sem falhar
    @Transactional
    @PostMapping("/loja/comprar/{itemId}")
    public ResponseEntity<Map<String, Object>> comprarItem(@PathVariable String itemId, @RequestBody Map<String, Integer> payload) {
        Usuario user = usuarioService.getCurrentUser();
        int preco = payload.getOrDefault("preco", 9999);
        
        Map<String, Object> resposta = new HashMap<>();
        
        // CORREÇÃO: Inicializa a lista caso o aluno seja novo
        if (user.getItensComprados() == null) {
            user.setItensComprados(new HashSet<>());
        }
        
        if (user.getItensComprados().contains(itemId)) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "Você já possui este item!");
            return ResponseEntity.badRequest().body(resposta);
        }
        
        if (user.getMoedas() < preco) {
            resposta.put("sucesso", false);
            resposta.put("mensagem", "EvoluCoins insuficientes!");
            return ResponseEntity.badRequest().body(resposta);
        }
        
        // Efetua a transação
        user.setMoedas(user.getMoedas() - preco);
        user.getItensComprados().add(itemId);
        
        usuarioRepository.save(user);
        
        resposta.put("sucesso", true);
        resposta.put("moedasRestantes", user.getMoedas());
        resposta.put("mensagem", "Compra realizada! O item foi adicionado à sua conta.");
        return ResponseEntity.ok(resposta);
    }
}