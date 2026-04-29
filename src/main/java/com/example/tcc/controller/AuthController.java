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
    // Chave: Email | Valor: Código de 6 dígitos
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    // Chave: Email | Valor: Dados do utilizador que aguarda ativação
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

    /**
     * PASSO 1: Solicitar Registo.
     * Verifica se o e-mail existe, gera o código e envia por e-mail.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO dto) {
        try {
            // 1. Verificar se o utilizador já existe na Base de Dados
            if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", "Este e-mail já está em uso no sistema."));
            }

            // 2. Gerar código OTP de 6 dígitos
            String otp = String.format("%06d", new Random().nextInt(999999));

            // 3. Guardar temporariamente na memória (NÃO salva no banco de dados ainda)
            otpStorage.put(dto.getEmail(), otp);
            pendingUsers.put(dto.getEmail(), dto);

            // 4. Enviar e-mail real
            emailService.enviarEmailVerificacao(dto.getEmail(), otp);
            
            System.out.println("LOG: Código OTP [" + otp + "] enviado para " + dto.getEmail());

            return ResponseEntity.ok(Map.of("mensagem", "Código de verificação enviado com sucesso para o seu e-mail."));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao processar o registo: " + e.getMessage()));
        }
    }

    /**
     * PASSO 2: Verificar Código e Ativar Conta.
     * Se o código estiver correto, o utilizador é finalmente gravado na Base de Dados.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyDTO dto) {
        String email = dto.getEmail();
        String codigo = dto.getCodigo();

        // Verificar se existem dados pendentes para este e-mail
        if (!otpStorage.containsKey(email) || !pendingUsers.containsKey(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Nenhum registo pendente encontrado para este e-mail. Solicite um novo código."));
        }

        // Verificar se o código coincide
        if (!otpStorage.get(email).equals(codigo)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "O código de verificação é inválido ou já expirou."));
        }

        try {
            // Código correto: Recuperar dados e persistir no banco de dados
            RegisterDTO data = pendingUsers.get(email);

            Usuario u = new Usuario();
            u.setNome(data.getNome());
            u.setEmail(data.getEmail());
            u.setSenha(passwordEncoder.encode(data.getSenha()));
            u.setAvatar("👨‍🎓"); // Avatar padrão
            u.setNivel(1);
            u.setXp(0);
            u.setRole("ROLE_ALUNO");

            usuarioRepository.save(u);

            // Limpar memória temporária
            otpStorage.remove(email);
            pendingUsers.remove(email);

            return ResponseEntity.ok(Map.of("mensagem", "Conta ativada com sucesso! Agora pode aceder à plataforma."));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao ativar a conta: " + e.getMessage()));
        }
    }

    /**
     * Reenviar o código de verificação para o e-mail.
     */
    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody ResendDTO dto) {
        String email = dto.getEmail();

        if (!pendingUsers.containsKey(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensagem", "Solicitação inválida. Inicie o processo de registo novamente."));
        }

        try {
            String novoOtp = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(email, novoOtp);

            emailService.enviarEmailVerificacao(email, novoOtp);
            
            return ResponseEntity.ok(Map.of("mensagem", "Um novo código foi enviado para " + email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro ao reenviar e-mail: " + e.getMessage()));
        }
    }

    /**
     * Efetuar o Login (Spring Security).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDTO dto, HttpServletRequest request, HttpServletResponse response) {
        try {
            // Autenticação via Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha())
            );

            // Guardar autenticação na Sessão
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            return ResponseEntity.ok(Map.of(
                    "mensagem", "Login efetuado com sucesso",
                    "redirect", "/"
            ));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensagem", "E-mail ou senha incorretos. Verifique as suas credenciais."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("mensagem", "Erro fatal no servidor ao tentar iniciar sessão."));
        }
    }

    // ==========================================================
    // DTOs - CLASSES DE TRANSFERÊNCIA DE DADOS
    // ==========================================================

    @Data
    public static class LoginDTO {
        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        private String email;

        @NotBlank(message = "A senha é obrigatória")
        private String senha;
    }

    @Data
    public static class RegisterDTO {
        @NotBlank(message = "O nome é obrigatório")
        private String nome;

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        private String email;

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres")
        private String senha;
    }

    @Data
    public static class VerifyDTO {
        @NotBlank(message = "O e-mail é obrigatório")
        private String email;

        @NotBlank(message = "O código é obrigatório")
        private String codigo;
    }

    @Data
    public static class ResendDTO {
        @NotBlank(message = "O e-mail é obrigatório")
        private String email;
    }
}