package com.example.tcc.controller;

import com.example.tcc.domain.Usuario;
import com.example.tcc.repository.UsuarioRepository;
import com.example.tcc.service.EmailService;
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
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, RegisterDTO> pendingUsers = new ConcurrentHashMap<>();

    public AuthController(UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto) {
        try {
            if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", "Este e-mail já está em uso no sistema."));
            }

            String otp = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(dto.getEmail(), otp);
            pendingUsers.put(dto.getEmail(), dto);

            emailService.enviarEmailVerificacao(dto.getEmail(), otp);

            return ResponseEntity.ok(Map.of("mensagem", "Código de verificação enviado para o seu e-mail."));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao processar o registo: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyDTO dto) {
        String email = dto.getEmail();
        String codigo = dto.getCodigo();

        if (!otpStorage.containsKey(email) || !pendingUsers.containsKey(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Nenhum registo pendente encontrado."));
        }

        if (!otpStorage.get(email).equals(codigo)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Código de verificação incorreto."));
        }

        try {
            RegisterDTO data = pendingUsers.get(email);
            Usuario u = new Usuario();
            u.setNome(data.getNome());
            u.setEmail(data.getEmail());
            u.setSenha(passwordEncoder.encode(data.getSenha()));
            u.setAvatar("👨‍🎓");
            u.setNivel(1);
            u.setXp(0);
            u.setRole("ROLE_ALUNO");

            usuarioRepository.save(u);
            otpStorage.remove(email);
            pendingUsers.remove(email);

            return ResponseEntity.ok(Map.of("mensagem", "Conta ativada com sucesso!"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao ativar a conta: " + e.getMessage()));
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody ResendDTO dto) {
        if (!pendingUsers.containsKey(dto.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Registo não encontrado."));
        }
        try {
            String novoOtp = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(dto.getEmail(), novoOtp);
            emailService.enviarEmailVerificacao(dto.getEmail(), novoOtp);
            return ResponseEntity.ok(Map.of("mensagem", "Novo código enviado!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao reenviar e-mail."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO dto, HttpServletRequest request,
            HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha()));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            return ResponseEntity.ok(Map.of("mensagem", "Login efetuado com sucesso", "redirect", "/"));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensagem", "E-mail ou senha incorretos."));
        }
    }

    @Data
    public static class LoginDTO {
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String senha;
    }

    @Data
    public static class RegisterDTO {
        @NotBlank
        private String nome;
        @NotBlank
        @Email
        private String email;
        @NotBlank
        @Size(min = 6)
        private String senha;
    }

    @Data
    public static class VerifyDTO {
        @NotBlank
        private String email;
        @NotBlank
        private String codigo;
    }

    @Data
    public static class ResendDTO {
        @NotBlank
        private String email;
    }
}