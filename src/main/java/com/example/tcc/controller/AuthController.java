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
        // PASSO 1: VERIFICAR BASE DE DADOS
        try {
            if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", "E-mail já está em uso."));
            }
        } catch (Exception dbError) {
            dbError.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "ERRO DE BASE DE DADOS NA NUVEM: O seu servidor não conseguiu ligar ao MySQL. Detalhe: " + dbError.getMessage()));
        }

        // PASSO 2: GERAR CÓDIGO E ENVIAR E-MAIL
        try {
            String otp = String.format("%06d", new Random().nextInt(999999));

            otpStorage.put(dto.getEmail(), otp);
            pendingUsers.put(dto.getEmail(), dto);

            emailService.enviarEmailVerificacao(dto.getEmail(), otp);
            System.out.println("E-mail enviado com sucesso pelo Render para: " + dto.getEmail());

            return ResponseEntity.ok(Map.of("mensagem", "Conta pré-criada. Verifique o seu e-mail."));
            
        } catch (Exception emailError) {
            emailError.printStackTrace();
            // Limpa da memória porque o e-mail falhou
            otpStorage.remove(dto.getEmail());
            pendingUsers.remove(dto.getEmail());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "ERRO AO ENVIAR E-MAIL: Verifique as configurações do Gmail no Render. Detalhe: " + emailError.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyDTO dto) {
        String email = dto.getEmail();
        String codigo = dto.getCodigo();

        if (!otpStorage.containsKey(email) || !pendingUsers.containsKey(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Nenhum registo pendente para este e-mail."));
        }

        if (!otpStorage.get(email).equals(codigo)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Código incorreto."));
        }

        try {
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

            otpStorage.remove(email);
            pendingUsers.remove(email);

            return ResponseEntity.ok(Map.of("mensagem", "Conta verificada e ativada com sucesso."));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "ERRO AO SALVAR NA BASE DE DADOS: Não foi possível gravar o utilizador validado. " + e.getMessage()));
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
            String novoOtp = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(email, novoOtp);

            emailService.enviarEmailVerificacao(email, novoOtp);

            return ResponseEntity.ok(Map.of("mensagem", "Novo código enviado com sucesso."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "ERRO AO REENVIAR E-MAIL: Falha no servidor. " + e.getMessage()));
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
                    .body(Map.of("mensagem", "ERRO FATAL NO SERVIDOR DE BASE DE DADOS: " + e.getMessage()));
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