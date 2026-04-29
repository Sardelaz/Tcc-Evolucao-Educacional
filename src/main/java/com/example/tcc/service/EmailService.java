package com.example.tcc.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    // Injeção de dependência das variáveis para podermos logar e verificar
    @Value("${spring.mail.host:HOST_NAO_ENCONTRADO}")
    private String host;

    @Value("${spring.mail.port:PORTA_NAO_ENCONTRADA}")
    private String port;

    @Value("${spring.mail.username:USUARIO_NAO_ENCONTRADO}")
    private String username;

    @Value("${spring.mail.password:SENHA_NAO_ENCONTRADA}")
    private String password;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarEmailVerificacao(String para, String codigoOtp) {
        log.info("======================================================");
        log.info("🔍 INICIANDO TENTATIVA DE ENVIO DE E-MAIL DE VERIFICAÇÃO");
        log.info("Destinatário: {}", para);
        log.info("Host configurado: {}", host);
        log.info("Porta configurada: {}", port);
        log.info("Usuário (Login Brevo): {}", username);
        
        // Mascara a senha para evitar vazamentos críticos, mas permite verificar se o Render a carregou
        String senhaOculta = "SENHA_NAO_ENCONTRADA";
        if (password != null && password.length() > 10) {
            senhaOculta = password.substring(0, 5) + "........" + password.substring(password.length() - 5);
        } else if (password != null && !password.equals("SENHA_NAO_ENCONTRADA")) {
            senhaOculta = "SENHA_CURTA_DEMAIS_PARA_SER_VALIDA";
        }
        log.info("Senha lida pelo sistema Render: {}", senhaOculta);
        log.info("======================================================");

        SimpleMailMessage mensagem = new SimpleMailMessage();
        
        // Remetente fixado. DEVE ser o seu e-mail do Gmail validado no Brevo
        mensagem.setFrom("joaoaugustosardelasardela@gmail.com"); 
        
        mensagem.setTo(para);
        mensagem.setSubject("Código de Verificação - Evolução Educacional");
        mensagem.setText("Olá!\n\n"
                + "Seja bem-vindo(a) à Evolução Educacional! \n"
                + "O seu código de verificação é: " + codigoOtp + "\n\n"
                + "Insira este código no site para ativar a sua conta.");
        
        try {
            log.info("⏳ Disparando mailSender.send(mensagem)...");
            mailSender.send(mensagem);
            log.info("✅ E-MAIL ENVIADO COM SUCESSO PARA: {}", para);
        } catch (Exception e) {
            log.error("❌ ERRO FATAL AO ENVIAR E-MAIL");
            log.error("Motivo da falha: ", e);
            throw new RuntimeException("Erro ao disparar e-mail: " + e.getMessage());
        }
    }
}