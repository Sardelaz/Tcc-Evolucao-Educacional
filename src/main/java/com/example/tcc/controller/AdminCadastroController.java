package com.example.tcc.controller;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AdminCadastroController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // DEFINA AQUI A SUA CHAVE DE SEGURANÇA
    private static final String CHAVE_MESTRA = "TCC_EVOLUCAO_2026";

    @GetMapping("/admin/cadastro")
    public String exibirFormularioCadastro() {
        return "admin-cadastro";
    }

    @PostMapping("/admin/cadastro")
    public String cadastrarDocente(@RequestParam String nome, 
                                   @RequestParam String email, 
                                   @RequestParam String senha, 
                                   @RequestParam String tokenSeguranca, // Recebe o token do formulário
                                   Model model) {
        
        // 1. VALIDAÇÃO DE SEGURANÇA
        if (!CHAVE_MESTRA.equals(tokenSeguranca)) {
            model.addAttribute("erro", "Código institucional inválido. Registo administrativo bloqueado.");
            return "admin-cadastro";
        }

        // 2. Verifica se o e-mail já existe
        if (usuarioRepository.findByEmail(email).isPresent()) {
            model.addAttribute("erro", "Este e-mail já está registado no sistema.");
            return "admin-cadastro";
        }

        try {
            Usuario novoDocente = new Usuario();
            novoDocente.setNome(nome);
            novoDocente.setEmail(email);
            novoDocente.setSenha(passwordEncoder.encode(senha)); 
            
            novoDocente.setRole("ROLE_ADMIN");
            
            novoDocente.setXp(0);
            novoDocente.setMoedas(0);
            novoDocente.setNivel(1);

            usuarioRepository.save(novoDocente);

            model.addAttribute("sucesso", "Conta docente criada com sucesso! Já pode fazer login.");
            return "admin-cadastro";

        } catch (Exception e) {
            model.addAttribute("erro", "Ocorreu um erro ao processar o cadastro.");
            return "admin-cadastro";
        }
    }
}