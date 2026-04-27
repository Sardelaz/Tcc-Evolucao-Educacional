package com.example.tcc.controller;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto) {
        try {
            if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já está em uso."));
            }

            Usuario u = new Usuario();
            u.setNome(dto.getNome());
            u.setEmail(dto.getEmail());
            u.setSenha(passwordEncoder.encode(dto.getSenha()));
            u.setAvatar("👨‍🎓");
            u.setNivel(1);
            u.setXp(0);
            u.setRole("ROLE_ALUNO"); 

            usuarioRepository.save(u);
            return ResponseEntity.ok(Map.of("mensagem", "Conta criada com sucesso"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro interno ao registar: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO dto, HttpServletRequest request, HttpServletResponse response) {
        try {
            // 1. Efetua a autenticação validando e-mail e senha
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha())
            );

            // 2. Cria o contexto de segurança e salva EXPLICITAMENTE na sessão
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            // 3. Agora todos os utilizadores são redirecionados para a Home "/"
            Map<String, String> body = new HashMap<>();
            body.put("mensagem", "Login efetuado com sucesso");
            body.put("redirect", "/");

            return ResponseEntity.ok(body);

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensagem", "Credenciais inválidas. Verifique o seu e-mail e a palavra-passe."));
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro fatal no servidor: " + e.getMessage()));
        }
    }

    @Data
    public static class LoginDTO {
        @NotBlank(message = "O e-mail não pode estar vazio")
        @Email(message = "O formato do e-mail é inválido")
        private String email;

        @NotBlank(message = "A palavra-passe não pode estar vazia")
        private String senha;
    }

    @Data
    public static class RegisterDTO {
        @NotBlank(message = "O nome não pode estar vazio")
        private String nome;

        @NotBlank(message = "O e-mail não pode estar vazio")
        @Email(message = "O formato do e-mail é inválido")
        private String email;

        @NotBlank(message = "A palavra-passe não pode estar vazia")
        @Size(min = 6, message = "A palavra-passe deve conter pelo menos 6 caracteres")
        private String senha;
    }
}