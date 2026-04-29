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
    private final EmailService emailService; // INJETADO AQUI
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    // Armazenamento temporário em memória para o processo de Registo (OTP)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, RegisterDTO> pendingUsers = new ConcurrentHashMap<>();

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto) {
        try {
            // Verifica se o email JÁ EXISTE no banco de dados
            if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já está em uso."));
            }

            // Gera código de 6 dígitos
            String otp = String.format("%06d", new Random().nextInt(999999));

            // Guarda os dados de registo APENAS NA MEMÓRIA
            otpStorage.put(dto.getEmail(), otp);
            pendingUsers.put(dto.getEmail(), dto);

            // ENVIA O E-MAIL REAL
            emailService.enviarEmailVerificacao(dto.getEmail(), otp);
            
            // Para debug no console, podes manter ou remover
            System.out.println("E-mail enviado para " + dto.getEmail() + " com código " + otp);

            return ResponseEntity.ok(Map.of("mensagem", "Conta pré-criada. Verifique o seu e-mail."));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro interno ao registar: Não foi possível enviar o e-mail. " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyDTO dto) {
        String email = dto.getEmail();
        String codigo = dto.getCodigo();

        // Se não houver nenhum registo pendente para este email
        if (!otpStorage.containsKey(email) || !pendingUsers.containsKey(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Nenhum registo pendente para este e-mail."));
        }

        // Se o código estiver errado
        if (!otpStorage.get(email).equals(codigo)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Código incorreto."));
        }

        try {
            // CÓDIGO CORRETO! Gravar utilizador no Banco de Dados
            RegisterDTO pendingData = pendingUsers.get(email);

            Usuario u = new Usuario();
            u.setNome(pendingData.getNome());
            u.setEmail(pendingData.getEmail());
            u.setSenha(passwordEncoder.encode(pendingData.getSenha()));
            u.setAvatar("👨‍🎓");
            u.setNivel(1);
            u.setXp(0);
            u.setRole("ROLE_ALUNO"); 

            usuarioRepository.save(u);

            // Limpa a memória
            otpStorage.remove(email);
            pendingUsers.remove(email);

            return ResponseEntity.ok(Map.of("mensagem", "Conta verificada e ativada com sucesso."));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro interno ao salvar conta validada."));
        }
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody ResendDTO dto) {
        String email = dto.getEmail();

        if (!pendingUsers.containsKey(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Não existe nenhum registo pendente para este e-mail."));
        }

        try {
            // Gera novo código
            String novoOtp = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(email, novoOtp);

            // ENVIA O E-MAIL REAL NOVAMENTE
            emailService.enviarEmailVerificacao(email, novoOtp);
            System.out.println("Novo e-mail enviado para " + email + " com código " + novoOtp);

            return ResponseEntity.ok(Map.of("mensagem", "Novo código enviado com sucesso."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao tentar reenviar o e-mail."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO dto, HttpServletRequest request, HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

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

    // ================= DTOs ================= //

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

    @Data
    public static class VerifyDTO {
        private String email;
        private String codigo;
    }

    @Data
    public static class ResendDTO {
        private String email;
    }
}