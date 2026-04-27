package com.example.tcc.controller;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // REGISTO COM VALIDAÇÃO MELHORADA E NORMALIZAÇÃO
    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody Usuario usuario) {
        // 1. Verificar se o e-mail já existe para evitar duplicatas
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Este e-mail já está registado!"));
        }

        // 2. Validação de força de senha (mínimo 6 caracteres e não nula)
        if (usuario.getSenha() == null || usuario.getSenha().trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("erro", "A senha deve ter pelo menos 6 caracteres."));
        }

        // 3. Configurações iniciais do aluno (Valores Padrão e Segurança)
        usuario.setNome(usuario.getNome().trim());
        usuario.setEmail(usuario.getEmail().toLowerCase().trim()); // Normaliza para evitar erros de login
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        usuario.setNivel(1);
        usuario.setXp(0);
        usuario.setMoedas(100); // Saldo inicial de EvoluCoins definido conforme lógica de negócio
        usuario.setStreakDiaria(0);
        usuario.setAvatar("👨‍🎓");
        usuario.setRole("ROLE_ALUNO"); // Define o papel padrão para novos usuários

        usuarioRepository.save(usuario);
        return ResponseEntity.ok(Map.of("mensagem", "Conta criada com sucesso!"));
    }

    // FUNÇÃO ESQUECI A SENHA (CORRIGIDA)
    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> solicitarRecuperacao(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "O e-mail é obrigatório."));
        }

        // Busca o usuário pelo e-mail normalizado
        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email.toLowerCase().trim());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erro", "E-mail não encontrado no sistema."));
        }

        // Validação concluída. Em um sistema real, aqui seria enviado um e-mail com token.
        return ResponseEntity.ok(Map.of("mensagem", "Utilizador verificado. Prossiga para a nova senha."));
    }

    // REDEFINIÇÃO DE SENHA (CORRIGIDA)
    @PostMapping("/resetar-senha")
    public ResponseEntity<?> resetarSenha(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String novaSenha = payload.get("novaSenha");

        if (novaSenha == null || novaSenha.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("erro", "A nova senha deve ter pelo menos 6 caracteres."));
        }

        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email.toLowerCase().trim());
        
        if (userOpt.isPresent()) {
            Usuario user = userOpt.get();
            user.setSenha(passwordEncoder.encode(novaSenha)); // Criptografa a nova senha
            usuarioRepository.save(user);
            return ResponseEntity.ok(Map.of("mensagem", "Senha atualizada com sucesso!"));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("erro", "Falha ao resetar senha. Utilizador não encontrado."));
    }
}